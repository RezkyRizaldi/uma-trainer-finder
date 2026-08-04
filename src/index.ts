#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import 'dotenv/config';
import inquirer from 'inquirer';
import ora from 'ora';

import { fetchSearch } from './api';
import { traineeOptions } from './constants';
import type { ApiResponse, CLIOptions, ExportType, Option, SearchResult, SearchSortingQuery } from './types';
import { chooseOption, printBoxedMessage, printTable } from './ui';
import { exportData } from './utils';
import pkg from '../package.json';

const PAGE_LIMIT = 20;
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
const handleExportPrompt = async (data: SearchResult[], presetFormat?: ExportType): Promise<string | null> => {
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

		const data: SearchResult[] = [];
		const seenIds = new Set<string>();
		const targetInfo = chalk.yellowBright(target.name);
		let page = 1;
		let consecutiveFails = 0;
		let reachedEnd = false;
		const pageHistory: number[] = [];

		while (true) {
			const spinner = ora(`Mengambil data ${targetInfo} — halaman ${page}...`).start();
			let response: ApiResponse | null = null;
			let fetchError: string | null = null;

			try {
				response = await fetchSearch(page - 1, PAGE_LIMIT, 'all', sortBy, target.value as number);
			} catch (err) {
				fetchError = err instanceof Error ? err.message : String(err);
			} finally {
				spinner.stop();
			}

			const newItems = response?.items ?? [];
			const dedupedItems = newItems.filter((nd) => !seenIds.has(nd.account_id));
			let statusMessage: string;
			let statusColor: 'cyan' | 'green' | 'red' | 'yellow';

			if (fetchError) {
				statusMessage = `❌ Gagal mengambil data: ${fetchError}.`;
				statusColor = 'red';
				consecutiveFails++;
				pageHistory.push(0);
			} else if (dedupedItems.length > 0) {
				for (const item of dedupedItems) seenIds.add(item.account_id);

				data.push(...dedupedItems);
				statusMessage = `✅ ${dedupedItems.length} data baru ditemukan (halaman ${page}).`;
				statusColor = 'green';
				consecutiveFails = 0;
				pageHistory.push(dedupedItems.length);
			} else {
				statusMessage = `⚠️ Tidak ada data baru di halaman ${page}.`;
				statusColor = 'yellow';
				consecutiveFails++;
				pageHistory.push(0);
			}

			if (response && response.page >= response.total_pages - 1) {
				reachedEnd = true;
			}

			const renderContent = () => {
				console.log(`🔍 Hasil pencarian untuk ${targetInfo}:\n`);
				printBoxedMessage(statusMessage, statusColor);

				if (data.length > 0) {
					console.log('');
					printTable(data);
				}
			};

			if (consecutiveFails >= MAX_CONSECUTIVE_FAILS) {
				process.stdout.write('\x1bc');
				renderContent();

				if (data.length === 0) {
					printBoxedMessage(`❌ Tidak ada data ditemukan untuk ${targetInfo}.`, 'red');
					process.exit(0);
				}

				printBoxedMessage(`⚠️ Pencarian dihentikan otomatis setelah ${MAX_CONSECUTIVE_FAILS} kegagalan berturut-turut.`, 'yellow');

				await handleExportPrompt(data, options.export);

				process.exit(0);
			}

			const actionChoices: Option<string>[] = reachedEnd ? [{ name: '💭 Halaman Terakhir Sudah Tercapai', value: 'end' }] : [{ name: '➡️ Lanjut ke Halaman Berikutnya', value: 'next' }];

			if (page > 1) {
				actionChoices.push({ name: '⬅️ Kembali ke Halaman Sebelumnya', value: 'prev' });
			}

			if (data.length > 0) {
				actionChoices.push({ name: '💾 Ekspor Hasil', value: 'export' });
			}

			actionChoices.push({ name: '🔙 Kembali ke Pemilihan Trainee', value: 'reset' }, { name: '🛑 Berhenti', value: 'stop' });

			const { value: action } = await chooseOption(actionChoices, 'Pilih Aksi', true, renderContent, false);

			if (action === 'stop') {
				await handleExportPrompt(data, options.export);

				process.exit(0);
			}

			if (action === 'prev') {
				const removedCount = pageHistory.pop() ?? 0;

				if (removedCount > 0) {
					const removed = data.splice(-removedCount);

					for (const item of removed) seenIds.delete(item.account_id);
				}

				page -= 1;
				reachedEnd = false;
				consecutiveFails = 0;

				continue;
			}

			if (action === 'export' || action === 'reset' || action === 'end') {
				const exported = await handleExportPrompt(data, options.export);

				if (exported) exportFeedback = `✅ Data berhasil diekspor ke ${exported}.`;

				if (action === 'export') continue;

				break;
			}

			page += 1;
		}
	}
})();
