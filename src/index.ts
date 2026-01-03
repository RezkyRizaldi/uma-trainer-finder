#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';

import { fetchAllPages } from './api';
import { traineeOptions } from './constants';
import type { CLIOptions, ExportType, OptionWithSpecial, SearchResult, SearchSortingQuery } from './types';
import { chooseOption, printTable } from './ui';
import { exportData, getBaseName, printBoxedMessage } from './utils';
import pkg from '../package.json';

/**
 * Handle export prompt.
 *
 * Menangani prompt untuk export data hasil pencarian.
 * Jika exportFormat diberikan, langsung export dengan format tersebut.
 * Jika tidak, tampilkan prompt konfirmasi dan pilih format via list.
 *
 * @param data - Data hasil pencarian yang akan diekspor.
 * @param exportFormat - Format ekspor ('csv' atau 'json'), opsional.
 * @returns Promise dengan nama file yang dibuat jika sukses, atau `null` jika tidak ada data atau user membatalkan.
 */
const handleExportPrompt = async (data: SearchResult[], exportFormat?: ExportType): Promise<string | null> => {
	if (data.length === 0) return null;

	let format: ExportType;

	if (exportFormat) {
		format = exportFormat;
	} else {
		const { shouldExport } = await inquirer.prompt<{ shouldExport: boolean }>({
			type: 'confirm',
			name: 'shouldExport',
			message: 'Apakah Anda ingin menyimpan hasil pencarian?',
			default: false,
		});

		if (!shouldExport) return null;

		const { exportFormat } = await inquirer.prompt<{ exportFormat: ExportType }>({
			type: 'select',
			name: 'exportFormat',
			message: 'Pilih format ekspor:',
			choices: [
				{ name: 'CSV', value: 'csv' },
				{ name: 'JSON', value: 'json' },
			],
		});

		format = exportFormat;
	}

	return exportData(data, format);
};

/**
 * Main loop program.
 *
 * Proses interaktif utama yang dijalankan saat program start:
 * 1. User memilih Sire → Grandsire → Granddam.
 * 2. Data hasil pencarian diambil dari API secara bertahap (per halaman).
 * 3. Hasil ditampilkan dalam bentuk tabel interaktif di terminal.
 *
 * @returns Berjalan terus hingga user memilih berhenti atau tidak ada data baru.
 */
(async () => {
	const mapping: Record<string, SearchSortingQuery> = {
		rank: 'parent_rank',
		affinity: 'affinity_score',
		win: 'win_count',
		sparks: 'white_count',
		latest: 'last_updated',
	};

	let sortBy: SearchSortingQuery = 'parent_rank';

	const program = new Command();
	program
		.name('uma-cli')
		.description('CLI untuk mencari data inheritance Umamusume: Pretty Derby')
		.version(pkg.version)
		.option('-s, --sort <type>', `Atur metode pengurutan hasil\n<${Object.keys(mapping).join(', ')}>`, (value) => {
			if (!mapping[value]) {
				console.error(
					`❌ Value ${chalk.bold(value)} tidak dikenal. Gunakan salah satu: ${Object.keys(mapping)
						.map((k) => chalk.greenBright(k))
						.join(', ')}.\nGunakan ${chalk.bold('--help')} untuk melihat daftar flag dan contoh penggunaannya.`
				);
				process.exit(1);
			}

			return mapping[value];
		})
		.option('-e, --export <format>', `Export hasil pencarian ke dalam format file\n<csv, json>`, (value) => {
			if (value !== 'csv' && value !== 'json') {
				console.error(`❌ Value ${chalk.bold(value)} tidak dikenal. Gunakan ${chalk.greenBright('csv')} atau ${chalk.greenBright('json')}.\nGunakan ${chalk.bold('--help')} untuk melihat daftar flag dan contoh penggunaannya.`);
				process.exit(1);
			}

			return value;
		});

	program.parse();
	const options = program.opts<CLIOptions>();

	if (options.sort) {
		sortBy = options.sort;
	}

	let exportFeedback: string | null = null;

	while (true) {
		const persistentRendererForSire = (): void => {
			if (exportFeedback) {
				printBoxedMessage(exportFeedback.trim(), 'green');
				exportFeedback = null;
			}
		};

		let sire = await chooseOption(traineeOptions, 'Pilih Sire', true, persistentRendererForSire);

		let gSire: OptionWithSpecial<number> | null = null;

		while (true) {
			const excludeBases = [getBaseName(sire.name)];

			gSire = await chooseOption(
				[...traineeOptions.filter((h) => !excludeBases.includes(getBaseName(h.name))), { name: '⏩ Lewati', value: 'skip', status: 'option' }, { name: '🔙 Kembali', value: null, status: 'option' }],
				`Pilih Grandsire untuk ${chalk.yellowBright(sire.name)}`
			);

			if (gSire.value === null) {
				sire = await chooseOption(traineeOptions, 'Pilih Sire');

				continue;
			}

			break;
		}

		let gDam: OptionWithSpecial<number> | null = null;

		if (gSire.value !== 'skip') {
			while (true) {
				const excludeBases = [getBaseName(sire.name), getBaseName(gSire.name)];

				gDam = await chooseOption(
					[...traineeOptions.filter((h) => !excludeBases.includes(getBaseName(h.name))), { name: '⏩ Lewati', value: 'skip', status: 'option' }, { name: '🔙 Kembali', value: null, status: 'option' }],
					`Pilih Granddam untuk ${chalk.yellowBright(sire.name)} x ${chalk.yellowBright(gSire.name)}`
				);

				if (gDam.value === null) {
					while (true) {
						const excludeBases2 = [getBaseName(sire.name)];

						gSire = await chooseOption(
							[...traineeOptions.filter((h) => !excludeBases2.includes(getBaseName(h.name))), { name: '⏩ Lewati', value: 'skip', status: 'option' }, { name: '🔙 Kembali', value: null, status: 'option' }],
							`Pilih Grandsire untuk ${chalk.yellowBright(sire.name)}`
						);

						if (gSire.value === null) {
							sire = await chooseOption(traineeOptions, 'Pilih Sire');

							continue;
						}

						if (gSire.value === 'skip') {
							gDam = { name: '⏩ Lewati', value: 'skip', status: 'option' };

							break;
						}

						break;
					}

					if (gDam.value === 'skip') break;

					continue;
				}

				break;
			}
		}

		let pageStart = 1;
		let consecutiveFails = 0;
		let isLoading = false;
		const data: SearchResult[] = [];
		const grandInfo = gSire.value !== 'skip' ? ` [${chalk.yellowBright(gSire.name)}${gDam?.value !== 'skip' ? ` x ${chalk.yellowBright(gDam?.name)}` : ''}]` : '';
		let shouldReset = false;

		while (consecutiveFails < 5) {
			isLoading = true;

			const spinner = ora(`Sedang mengambil data untuk ${chalk.yellowBright(sire.name) + grandInfo} di halaman ${pageStart} s/d ${pageStart + 19}...`).start();
			let newData: SearchResult[];

			try {
				newData = await fetchAllPages(sire.value as number, gSire.value !== 'skip' ? (gSire.value as number) : null, gDam?.value !== 'skip' ? (gDam?.value as number) : null, pageStart, sortBy);
			} finally {
				spinner.stop();
			}

			isLoading = false;

			const trulyNewData = newData.filter((nd) => !data.some((d) => d.account_id === nd.account_id));
			let statusMessage: string;
			let color: 'cyan' | 'green' | 'red' | 'yellow';

			if (trulyNewData.length > 0) {
				data.push(...trulyNewData);
				statusMessage = `✅ Ditemukan ${trulyNewData.length} data baru di halaman ${pageStart} s/d ${pageStart + 19}.`;
				color = 'green';
				consecutiveFails = 0;
			} else {
				statusMessage = `⚠️ Tidak ditemukan data di halaman ${pageStart} s/d ${pageStart + 19}.`;
				color = 'yellow';
				consecutiveFails++;
			}

			process.stdout.write('\x1bc');

			/**
			 * Renderer tambahan untuk menjaga agar status dan tabel data tetap tampil
			 * setiap kali daftar opsi `nextAction` dirender ulang.
			 *
			 * Fungsi ini akan:
			 * - Menampilkan pesan status proses `statusMessage`.
			 * - Menampilkan tabel data dari `printTable()`.
			 *
			 * @returns Tidak mengembalikan apa pun; hanya mencetak ke `stdout`.
			 */
			const persistentRenderer = (): void => {
				if (isLoading) {
					console.log(`⏳ Sedang mengambil data untuk ${sire.name + grandInfo} di halaman ${pageStart} ...`);
				} else {
					console.log(`🔍 Hasil fetching data untuk ${chalk.yellowBright(sire.name) + grandInfo}:\n`);
					printBoxedMessage(statusMessage, color);
					console.log('');
				}

				if (!isLoading && data.length > 0) {
					printTable(data);
				}
			};

			if (consecutiveFails >= 5) {
				if (data.length === 0) {
					printBoxedMessage(`❌ Tidak ada data ditemukan untuk ${chalk.yellowBright(sire.name) + grandInfo} setelah mencari 5 halaman.`, 'red');
					process.exit(0);
				} else {
					printBoxedMessage(`⚠️ Tidak ada data baru ditemukan untuk ${chalk.yellowBright(sire.name) + grandInfo} setelah 5 percobaan berturut-turut. Pencarian dihentikan.`, 'yellow');
					printTable(data);

					await handleExportPrompt(data, options.export);

					process.exit(0);
				}
				break;
			}

			const nextAction = await chooseOption(
				[
					{ name: '➡️ Lanjut', value: 'next', status: 'option' as const },
					{ name: '🔙 Kembali', value: 'reset', status: 'option' as const },
					{ name: '🛑 Berhenti', value: 'stop', status: 'option' as const },
				],
				'Cari di Halaman Berikutnya',
				true,
				persistentRenderer,
				false
			);

			if (nextAction.value === 'stop') {
				await handleExportPrompt(data, options.export);

				process.exit(0);
			}

			if (nextAction.value === 'reset') {
				const exported = await handleExportPrompt(data, options.export);

				if (exported) exportFeedback = `✅ Data berhasil diekspor ke ${exported}.\n`;

				shouldReset = true;

				break;
			}

			pageStart += 20;
		}

		if (shouldReset) {
			shouldReset = false;
			data.length = 0;
			pageStart = 1;
			consecutiveFails = 0;

			continue;
		}
	}
})();
