import chalk from 'chalk';
import inquirer from 'inquirer';
import stripAnsi from 'strip-ansi';
import { getBorderCharacters, table } from 'table';

import type { Option, SearchResult } from './types';
import { formatSpark, formatSupportCard, getRankLabel, traineeMap } from './utils';

let showUpcoming = false;

/**
 * Mencetak hasil pencarian dalam bentuk tabel responsif ke console.
 * Menggunakan lebar terminal untuk menyesuaikan kolom, dengan header berwarna dan data terpusat.
 *
 * Fungsi ini:
 * - Membuat header tabel dengan lebar kolom tetap.
 * - Membungkus teks panjang agar sesuai dengan lebar kolom.
 * - Meratakan teks di setiap kolom (center).
 * - Menggambar tabel dengan karakter box-drawing.
 * - Menampilkan tabel akhir ke console.
 *
 * @param data - Array hasil pencarian untuk ditampilkan.
 * @returns Tidak mengembalikan nilai, hanya mencetak tabel ke console.
 */
export const printTable = (data: SearchResult[]) => {
	const maxW = [4, 25, 27, 27, 27, 32, 100, 32];
	const headers = ['#', 'Account', 'Parent', 'Grandsire', 'Granddam', 'Support Card', 'Sparks', 'Info'].map((h) => chalk.cyan.bold(h));
	const totalDefault = maxW.reduce((a, b) => a + b, 0) + headers.length * 3 + 1;
	const termWidth = process.stdout.columns ?? totalDefault;

	const rows = data.map((d, i) => {
		const rank = d.inheritance?.parent_rank;
		const rankLabel = rank != null ? getRankLabel(rank) : '-';

		return [
			`${i + 1}.`,
			`${d.trainer_name}\n${d.account_id}`,
			traineeMap[d.inheritance?.main_parent_id ?? -1] ?? d.inheritance?.main_parent_id?.toString() ?? '-',
			traineeMap[d.inheritance?.parent_left_id ?? -1] ?? d.inheritance?.parent_left_id?.toString() ?? '-',
			traineeMap[d.inheritance?.parent_right_id ?? -1] ?? d.inheritance?.parent_right_id?.toString() ?? '-',
			formatSupportCard(d.support_card),
			formatSpark([...(d.inheritance?.blue_sparks ?? []), ...(d.inheritance?.pink_sparks ?? []), ...(d.inheritance?.green_sparks ?? []), ...(d.inheritance?.white_sparks ?? [])]),
			`Affinity: ${d.inheritance?.affinity_score ?? '-'}\nGI Wins: ${d.inheritance?.win_count ?? '-'}\nWhite Skills: ${d.inheritance?.white_count ?? '-'}\nRank: ${rankLabel} (${rank ?? '-'})`,
		];
	});

	const output = table([headers, ...rows], {
		border: getBorderCharacters('honeywell'),
		columns: maxW.map((w) => ({
			alignment: 'center',
			verticalAlignment: 'middle',
			width: Math.max(6, Math.floor(w * Math.min(1, termWidth / totalDefault))),
			wrapWord: true,
		})),
	});

	console.log(output);
};

/**
 * Mencetak pesan dalam kotak persegi panjang.
 *
 * @param message - Pesan yang akan dicetak.
 * @param color - Warna border (default: 'cyan').
 * @returns Tidak mengembalikan nilai, hanya mencetak ke console.
 */
export const printBoxedMessage = (message: string, color: 'cyan' | 'green' | 'red' | 'yellow' = 'cyan') => {
	const lines = message.split('\n');
	const stripped = lines.map(stripAnsi);
	const maxLen = Math.max(...stripped.map((s) => s.length));
	const top = '┌' + '─'.repeat(maxLen + 4) + '┐';
	const bottom = '└' + '─'.repeat(maxLen + 4) + '┘';
	const middle = lines.map((l, i) => '│ ' + l + ' '.repeat(maxLen - (stripped[i]?.length ?? 0)) + ' │');

	console.log(chalk[color](top));
	middle.forEach((l) => console.log(chalk[color](l)));
	console.log(chalk[color](bottom));
};

/**
 * Menampilkan menu interaktif untuk memilih opsi menggunakan Inquirer.
 * Mendukung navigasi keyboard, toggle upcoming, dan persistent rendering untuk status/tabel.
 *
 * Fungsi ini menampilkan daftar opsi, lalu menunggu input keyboard user:
 * - Panah ↑/↓ untuk navigasi antar opsi.
 * - Enter untuk memilih opsi yang disorot.
 * - Ctrl+C untuk keluar dari program.
 * - Huruf (A–Z) untuk lompat ke opsi pertama yang sesuai.
 *
 * @template T               - Tipe nilai opsi.
 * @param opts 					 		 - Daftar opsi tersedia.
 * @param msg 							 - Pesan prompt.
 * @param clearScreen 			 - Bersihkan layar terminal setiap render (default true).
 * @param persistentRenderer - Fungsi untuk render status/tabel tambahan.
 * @param withToggle  			 - Tampilkan opsi toggle upcoming (default true).
 * @returns Opsi yang dipilih user.
 */
export const chooseOption = async <T>(opts: Option<T>[], msg: string, clearScreen = true, persistentRenderer: (() => void) | null = null, withToggle = true) => {
	while (true) {
		if (clearScreen) process.stdout.write('\x1bc');

		persistentRenderer?.();

		const baseOpts = showUpcoming ? opts : opts.filter((o) => o.status === 'released' || o.status === undefined);
		const list = withToggle
			? [
					...baseOpts,
					{
						name: showUpcoming ? '🚫 Sembunyikan karakter yang akan datang' : '👁️ Tampilkan karakter yang akan datang',
						value: '__toggleUpcoming' as unknown as T,
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
			const { chosen } = (await inquirer.prompt<{ chosen: Option<T> }>([
				{
					type: 'select',
					name: 'chosen',
					message: chalk.bold(msg + (withToggle ? ` (${chalk.greenBright('↑')}/${chalk.greenBright('↓')} lalu ${chalk.greenBright('Enter')})` : '')),
					choices: inquirerChoices,
					loop: false,
					pageSize: 20,
					default: defaultValue,
				},
			])) as { chosen: Option<T> };

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
