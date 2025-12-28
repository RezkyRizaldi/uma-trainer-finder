#!/usr/bin/env node

import chalk from 'chalk';
import { distance } from 'fastest-levenshtein';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { fetchAllPages } from './api';
import { traineeOptions } from './constants';
import type { OptionWithSpecial, SearchResult, SearchSortingQuery } from './types';
import { chooseOption, printTable } from './ui';
import { getBaseName } from './utils';
import pkg from '../package.json';

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

	const rawArgs = process.argv.slice(2);
	const validFlags = ['--help', '--sort', '--version'];

	for (const raw of rawArgs) {
		const [flagName] = raw.split('=');

		if (flagName && !flagName.startsWith('--')) continue;

		if (flagName && !validFlags.includes(flagName)) {
			let suggestion = `\n💡 Gunakan ${chalk.bold('--help')} untuk melihat daftar flag dan contoh penggunaannya.`;
			for (const vFlag of validFlags) {
				if (distance(flagName, vFlag) <= 2) {
					suggestion = `, mungkin maksud Anda: ${chalk.bold(vFlag)}. Gunakan ${chalk.bold('--help')} untuk melihat daftar flag dan contoh penggunaannya.`;
					break;
				}
			}
			console.error(`❌ Flag ${chalk.bold(flagName)} tidak dikenal${suggestion}`);
			process.exit(1);
		}
	}

	const argv = yargs(hideBin(process.argv))
		.usage('Usage: uma-cli [options]')
		.option('sort', {
			type: 'string',
			describe: 'Atur metode pengurutan hasil',
			choices: Object.keys(mapping),
		})
		.version(pkg.version)
		.alias('version', 'v')
		.help('help')
		.alias('help', 'h')
		.parseSync() as { sort?: string; version?: boolean };

	if (argv.sort) {
		const val = argv.sort;
		if (mapping[val]) {
			sortBy = mapping[val];
		} else {
			console.error(
				`❌ Value ${chalk.bold(val)} tidak dikenal. Gunakan salah satu: ${Object.keys(mapping)
					.map((k) => chalk.greenBright(`--sort=${k}`))
					.join(', ')}\n\n${chalk.bold('--help')} untuk melihat daftar flag dan contoh penggunaannya.`
			);
			process.exit(1);
		}
	}

	let sire = await chooseOption(traineeOptions, 'Pilih Sire');

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

	while (consecutiveFails < 5) {
		isLoading = true;
		process.stdout.write('\x1bc');
		console.log(`⏳ Sedang mengambil data untuk ${chalk.yellowBright(sire.name) + grandInfo} di halaman ${pageStart} ...`);

		const newData = await fetchAllPages(sire.value as number, gSire.value !== 'skip' ? (gSire.value as number) : null, gDam?.value !== 'skip' ? (gDam?.value as number) : null, pageStart, sortBy);
		isLoading = false;

		const trulyNewData = newData.filter((nd) => !data.some((d) => d.account_id === nd.account_id));
		let statusMessage = `🔍 Hasil fetching data untuk ${chalk.yellowBright(sire.name) + grandInfo}\n`;

		if (trulyNewData.length > 0) {
			data.push(...trulyNewData);
			statusMessage += `\n✅ Ditemukan ${trulyNewData.length} data baru di halaman ${pageStart} s/d ${pageStart + 19}.`;
			consecutiveFails = 0;
		} else {
			statusMessage += `\n⚠️ Tidak ditemukan data di halaman ${pageStart} s/d ${pageStart + 19}.`;
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
			console.log(isLoading ? `⏳ Sedang mengambil data untuk ${sire.name + grandInfo} di halaman ${pageStart} ...` : statusMessage);
			if (!isLoading && data.length > 0) printTable(data);
		};

		if (consecutiveFails >= 5) {
			if (data.length === 0) {
				console.log(`❌ Tidak ada data ditemukan untuk ${chalk.yellowBright(sire.name) + grandInfo} setelah mencari 5 halaman.`);
			} else {
				console.log(`⚠️ Tidak ada data baru ditemukan untuk ${chalk.yellowBright(sire.name) + grandInfo} setelah 5 percobaan berturut-turut. Pencarian dihentikan.`);
				printTable(data);
			}
			break;
		}

		const nextAction = await chooseOption(
			[
				{ name: '➡️ Lanjut', value: 'next', status: 'option' },
				{ name: '🛑 Berhenti', value: 'stop', status: 'option' },
			],
			'\nCari di Halaman Berikutnya',
			true,
			persistentRenderer,
			false
		);

		if (nextAction.value === 'stop') break;

		pageStart += 20;
	}
})();
