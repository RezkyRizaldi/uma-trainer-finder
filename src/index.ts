#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import 'dotenv/config';
import inquirer from 'inquirer';
import ora from 'ora';

import { fetchSearch } from './api';
import { traineeOptions } from './constants';
import type { CLIOptions, ExportType, Option, SearchResult, SearchSortingQuery } from './types';
import { chooseOption, printBoxedMessage, printTable } from './ui';
import { exportData } from './utils';
import pkg from '../package.json';

/** Jumlah item per pemanggilan API. */
const FETCH_LIMIT = 100;

/** Jumlah item yang ditampilkan per halaman. */
const PAGE_SIZE = 20;

/** Jumlah kegagalan fetch berturut-turut sebelum pencarian dihentikan otomatis. */
const MAX_CONSECUTIVE_FAILS = 5;

/**
 * Menangani alur ekspor data hasil pencarian secara interaktif.
 *
 * Jika `presetFormat` diberikan via flag CLI, langsung ekspor tanpa prompt.
 * Jika tidak, tanya user apakah ingin ekspor, lalu pilih format (CSV/JSON).
 *
 * @param data         - Data hasil pencarian yang akan diekspor.
 * @param presetFormat - Format ekspor dari flag CLI, opsional.
 * @returns Nama file yang dibuat jika berhasil, atau `null` jika dibatalkan.
 */
const handleExportPrompt = async (data: SearchResult[], presetFormat?: ExportType) => {
	if (data.length === 0) return null;

	if (presetFormat) return exportData(data, presetFormat);

	const { shouldExport } = await inquirer.prompt<{ shouldExport: boolean }>({
		type: 'confirm',
		name: 'shouldExport',
		message: 'Apakah Anda ingin menyimpan hasil pencarian?',
		default: false,
	});

	if (!shouldExport) return null;

	const { format } = await inquirer.prompt<{ format: ExportType }>({
		type: 'select',
		name: 'format',
		message: 'Pilih format ekspor:',
		choices: [
			{ name: 'CSV', value: 'csv' },
			{ name: 'JSON', value: 'json' },
		],
	});

	return exportData(data, format);
};

(async () => {
	const sortMapping: Record<string, SearchSortingQuery> = {
		rank: 'parent_rank',
		affinity: 'affinity_score',
		trending: 'trending',
		win: 'win_count',
		sparks: 'white_count',
		blue: 'blue_stars_sum',
		pink: 'pink_stars_sum',
		green: 'green_stars_sum',
		white: 'white_stars_sum',
		latest: 'last_updated',
	};

	const program = new Command();
	program
		.name('uma-cli')
		.description('CLI untuk mencari data inheritance Umamusume: Pretty Derby')
		.version(pkg.version)
		.option('-s, --sort <type>', `Atur metode pengurutan hasil\n<${Object.keys(sortMapping).join(', ')}>`, (value) => {
			if (!sortMapping[value]) {
				console.error(
					`❌ Value ${chalk.bold(value)} tidak dikenal. Gunakan salah satu: ${Object.keys(sortMapping)
						.map((k) => chalk.greenBright(k))
						.join(', ')}.\nGunakan ${chalk.bold('--help')} untuk melihat daftar flag.`,
				);
				process.exit(1);
			}
			return sortMapping[value];
		})
		.option('-e, --export <format>', 'Export hasil pencarian ke file\n<csv, json>', (value) => {
			if (value !== 'csv' && value !== 'json') {
				console.error(`❌ Value ${chalk.bold(value)} tidak dikenal. Gunakan ${chalk.greenBright('csv')} atau ${chalk.greenBright('json')}.\nGunakan ${chalk.bold('--help')} untuk melihat daftar flag.`);
				process.exit(1);
			}
			return value;
		});

	program.parse();

	const options = program.opts<CLIOptions>();
	const sortBy: SearchSortingQuery = options.sort ?? 'affinity_score';
	let exportFeedback: string | null = null;
	const traineeChoices = [...traineeOptions, { name: '🛑 Berhenti', value: 'stop' as unknown as number }];

	while (true) {
		const target = await chooseOption(traineeChoices, 'Pilih Target Trainee', true, () => {
			if (!exportFeedback) return;
			printBoxedMessage(exportFeedback, 'green');
			exportFeedback = null;
		});

		if ((target.value as unknown as string) === 'stop') process.exit(0);

		const allData: SearchResult[] = [];
		const seenIds = new Set<string>();
		const targetInfo = chalk.yellowBright(target.name);
		let displayPage = 1;
		let apiBatchCount = 0;
		let reachedApiEnd = false;
		let consecutiveFails = 0;
		let fetchStatus: { message: string; color: 'cyan' | 'green' | 'red' | 'yellow' } | null = null;

		while (true) {
			const startIdx = (displayPage - 1) * PAGE_SIZE;

			if (startIdx >= allData.length && !reachedApiEnd) {
				const spinner = ora(`Mengambil data untuk ${targetInfo}...`).start();

				try {
					const response = await fetchSearch(apiBatchCount, FETCH_LIMIT, 'all', sortBy, target.value as number);

					const newItems = (response.items ?? []).filter((nd) => !seenIds.has(nd.account_id));

					for (const item of newItems) seenIds.add(item.account_id);

					allData.push(...newItems);
					apiBatchCount++;

					if (response.page >= response.total_pages - 1) reachedApiEnd = true;

					if (newItems.length > 0) {
						fetchStatus = { message: `✅ ${newItems.length} data baru ditemukan.`, color: 'green' };
						consecutiveFails = 0;
					} else {
						fetchStatus = { message: `⚠️ Tidak ada data baru dari API.`, color: 'yellow' };
						consecutiveFails++;
					}
				} catch (err) {
					fetchStatus = {
						message: `❌ Gagal mengambil data: ${err instanceof Error ? err.message : String(err)}.`,
						color: 'red',
					};
					consecutiveFails++;
				} finally {
					spinner.stop();
				}

				if (consecutiveFails >= MAX_CONSECUTIVE_FAILS) {
					process.stdout.write('\x1bc');
					console.log(`🔍 Hasil pencarian untuk ${targetInfo}:\n`);

					if (fetchStatus) printBoxedMessage(fetchStatus.message, fetchStatus.color);

					if (allData.length === 0) {
						printBoxedMessage(`❌ Tidak ada data ditemukan untuk ${targetInfo}.`, 'red');
						process.exit(0);
					}

					printBoxedMessage(`⚠️ Pencarian dihentikan otomatis setelah ${MAX_CONSECUTIVE_FAILS} kegagalan berturut-turut.`, 'yellow');

					await handleExportPrompt(allData, options.export);

					process.exit(0);
				}
			}

			const currentPageData = allData.slice(startIdx, startIdx + PAGE_SIZE);
			const totalDisplayPages = Math.max(1, Math.ceil(allData.length / PAGE_SIZE));
			const endIdx = Math.min(startIdx + PAGE_SIZE, allData.length);
			const hasMorePages = displayPage < totalDisplayPages || !reachedApiEnd;
			const apiSuffix = reachedApiEnd ? '' : '+';
			const footer = allData.length > 0 ? `Halaman ${displayPage} dari ${totalDisplayPages}${apiSuffix} · Menampilkan data ${startIdx + 1}–${endIdx} dari ${allData.length}${apiSuffix}` : undefined;

			const renderContent = () => {
				console.log(`🔍 Hasil pencarian untuk ${targetInfo}:`);

				if (fetchStatus) printBoxedMessage(fetchStatus.message, fetchStatus.color);

				if (currentPageData.length > 0) {
					printTable(currentPageData, startIdx, footer);
				}
			};

			const actionChoices: Option<string>[] = hasMorePages ? [{ name: '➡️ Lanjut ke Halaman Berikutnya', value: 'next' }] : [{ name: '💭 Halaman Terakhir Sudah Tercapai', value: 'end' }];

			if (displayPage > 1) {
				actionChoices.push({ name: '⬅️ Kembali ke Halaman Sebelumnya', value: 'prev' });
			}

			if (allData.length > 0) {
				actionChoices.push({ name: '💾 Ekspor Hasil', value: 'export' });
			}

			actionChoices.push({ name: '🔙 Kembali ke Pemilihan Trainee', value: 'reset' }, { name: '🛑 Berhenti', value: 'stop' });

			const { value: action } = await chooseOption(actionChoices, 'Pilih Aksi', true, renderContent, false);

			if (action === 'next') {
				displayPage++;
				fetchStatus = null;
				continue;
			}

			if (action === 'prev') {
				displayPage--;
				fetchStatus = null;
				continue;
			}

			if (action === 'stop') {
				await handleExportPrompt(allData, options.export);

				process.exit(0);
			}

			if (action === 'export' || action === 'reset' || action === 'end') {
				const exported = await handleExportPrompt(allData, options.export);

				if (exported) exportFeedback = `✅ Data berhasil diekspor ke ${exported}.`;

				if (action === 'export') continue;

				break;
			}
		}
	}
})();
