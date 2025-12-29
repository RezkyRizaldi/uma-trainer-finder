import chalk from 'chalk';
import inquirer from 'inquirer';
import { getBorderCharacters, table } from 'table';

import type { OptionWithSpecial, SearchResult } from './types';
import { formatSpark, formatSupportCard, traineeMap } from './utils';

/**
 * State untuk toggle tampilan karakter upcoming.
 */
let showUpcoming = false;

/**
 * Mencetak hasil pencarian dalam bentuk tabel ke console.
 *
 * Fungsi ini:
 * - Membuat header tabel dengan lebar kolom tetap.
 * - Membungkus teks panjang agar sesuai dengan lebar kolom.
 * - Meratakan teks di setiap kolom (center).
 * - Menggambar tabel dengan karakter box-drawing.
 * - Menampilkan tabel akhir ke console.
 *
 * @param data - Array hasil pencarian yang akan ditampilkan.
 * @returns Tidak mengembalikan nilai, hanya mencetak tabel ke console.
 */
export const printTable = (data: SearchResult[]) => {
	const headers = ['#', 'Account ID', 'Account Name', 'Grandsire', 'Granddam', 'Support Card', 'Sparks'].map((h) => chalk.cyan.bold(h));
	const maxW = [6, 12, 15, 25, 25, 35, 70];
	const totalDefault = maxW.reduce((a, b) => a + b, 0) + headers.length * 3 + 1;
	const termWidth = process.stdout.columns ?? totalDefault;

	const rows = data.map((d, i) => [
		`${i + 1}.`,
		d.account_id,
		d.trainer_name,
		traineeMap[d?.inheritance?.parent_left_id ?? -1] ?? d?.inheritance?.parent_left_id?.toString() ?? '-',
		traineeMap[d?.inheritance?.parent_right_id ?? -1] ?? d?.inheritance?.parent_right_id?.toString() ?? '-',
		formatSupportCard(d.support_card),
		formatSpark([...(d?.inheritance?.blue_sparks ?? []), ...(d?.inheritance?.pink_sparks ?? []), ...(d?.inheritance?.green_sparks ?? []), ...(d?.inheritance?.white_sparks ?? [])]),
	]);

	const output = table([headers, ...rows], {
		border: getBorderCharacters('honeywell'),
		columns: maxW.map((w) => ({
			alignment: 'center',
			verticalAlignment: 'middle',
			width: Math.max(8, Math.floor(w * Math.min(1, termWidth / totalDefault))),
			wrapWord: true,
		})),
	});

	console.log(`\n${output}`);
};

/**
 * Membuka menu interaktif di terminal untuk memilih satu opsi.
 *
 * Fungsi ini menampilkan daftar opsi, lalu menunggu input keyboard user:
 * - Panah ↑/↓ untuk navigasi antar opsi.
 * - Enter untuk memilih opsi yang disorot.
 * - Ctrl+C untuk keluar dari program.
 * - Huruf (A–Z) untuk lompat ke opsi pertama yang sesuai.
 *
 * @template T
 * @param opts 					 		 - Daftar opsi yang tersedia.
 * @param msg 							 - Pesan prompt yang ditampilkan ke user.
 * @param clearScreen 			 - Jika true, layar terminal dibersihkan setiap render.
 * @param persistentRenderer - Fungsi untuk menampilkan status proses dan tabel data.
 * @param withToggle  			 - Apakah menampilkan opsi toggle upcoming.
 * @returns Promise yang menyelesaikan dengan opsi yang dipilih user.
 */
export const chooseOption = async <T>(opts: OptionWithSpecial<T>[], msg: string, clearScreen = true, persistentRenderer: (() => void) | null = null, withToggle = true): Promise<OptionWithSpecial<T>> => {
	while (true) {
		if (clearScreen) process.stdout.write('\x1bc');
		persistentRenderer?.();

		const baseOpts = showUpcoming ? opts : opts.filter((o) => o.status === 'released' || o.status === 'option');
		const list: OptionWithSpecial<T>[] = withToggle
			? [
					...baseOpts,
					{
						name: showUpcoming ? '🚫 Sembunyikan karakter yang akan datang' : '👁️  Tampilkan karakter yang akan datang',
						value: '__toggleUpcoming',
						status: 'option',
					},
				]
			: baseOpts;

		const inquirerChoices = list.map((o) => ({
			name: o.name,
			value: o,
			short: o.name,
			disabled: o.status === 'upcoming' ? chalk.italic.bold('<Upcoming>') : o.status === 'unreleased' ? chalk.italic.bold('<Unreleased>') : false,
		}));

		const firstSelectableIndex = inquirerChoices.findIndex((c) => !c.disabled);
		const defaultValue = firstSelectableIndex >= 0 ? inquirerChoices[firstSelectableIndex]?.value : undefined;

		try {
			const { chosen } = (await inquirer.prompt<{ chosen: OptionWithSpecial<T> }>([
				{
					type: 'select',
					name: 'chosen',
					message: chalk.bold(msg + (withToggle ? ` (${chalk.greenBright('↑')}/${chalk.greenBright('↓')} lalu ${chalk.greenBright('Enter')})` : '')),
					choices: inquirerChoices,
					loop: false,
					pageSize: 20,
					default: defaultValue,
				},
			])) as { chosen: OptionWithSpecial<T> };

			if (chosen.value === '__toggleUpcoming') {
				showUpcoming = !showUpcoming;
				continue;
			}

			return chosen;
		} catch (err) {
			if (err instanceof Error && err.message?.includes('force closed')) {
				process.exit(0);
			}

			throw err;
		}
	}
};
