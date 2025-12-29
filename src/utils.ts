import * as fs from 'fs';
import * as path from 'path';

import chalk from 'chalk';

import { blueSparkOptions, greenSparkOptions, pinkSparkOptions, supportCardOptions, traineeOptions, whiteSparkOptions } from './constants';
import type { Option, SearchResult, SupportCard, SupportData } from './types';

/** Pemetaan data trainee (horse). */
export const traineeMap: Record<number, string> = Object.fromEntries(traineeOptions.map(({ value, name }) => [value, name]));

/** Pemetaan data support card. */
const supportCardMap: Record<number, SupportCard> = Object.fromEntries(supportCardOptions.map((c) => [c.value, c]));

/**
 * Memformat data support card untuk visual di tabel.
 *
 * Jika data kosong akan mengembalikan "-", jika ID tidak ditemukan
 * akan mengembalikan ID mentah, selain itu akan menampilkan nama,
 * tipe, rarity, dan jumlah limit break (jika ada).
 *
 * @param data - Data support card dari API.
 * @returns Representasi string support card untuk tabel.
 */
export const formatSupportCard = (data?: SupportData) => {
	if (!data) return '-';
	const c = supportCardMap[data.support_card_id];
	if (!c) return `${data.support_card_id}`;

	let formattedType;
	switch (c.type) {
		case 'Speed':
			formattedType = chalk.blueBright(c.type);
			break;
		case 'Stamina':
			formattedType = chalk.redBright(c.type);
			break;
		case 'Power':
		case 'Pal':
			formattedType = chalk.hex('#DB8500')(c.type);
			break;
		case 'Guts':
			formattedType = chalk.hex('#DB698E')(c.type);
			break;
		case 'Wit':
			formattedType = chalk.green(c.type);
			break;
		default:
			formattedType = chalk.greenBright(c.type);
			break;
	}

	return `${c.name} [${formattedType}] (${c.rarity}${data.limit_break_count > 0 ? ` ${chalk.yellow('★'.repeat(data.limit_break_count))}` : ''})`;
};

/**
 * Mengambil daftar Sparks dan mengembalikan nama Sparks sesuai value yang diberikan.
 *
 * Fungsi ini mencari setiap angka Spark yang diberikan dalam daftar Sparks
 * (Blue, Pink, Green, White) dan mengembalikan nama Sparks yang sesuai.
 * Jika value tidak ditemukan, akan dikembalikan '?' sebagai placeholder.
 *
 * @param sparks - Array angka Spark yang ingin diformat.
 * @returns Daftar nama Sparks yang sesuai, dipisahkan koma.
 */
export const formatSpark = (sparks: number[]) => {
	const color = {
		blue: (t: string) => chalk.bgBlue(chalk.whiteBright(` ${t} `)),
		pink: (t: string) => chalk.bgMagenta(chalk.whiteBright(` ${t} `)),
		green: (t: string) => chalk.bgGreen(chalk.whiteBright(` ${t} `)),
		white: (t: string) => chalk.bgGray(chalk.whiteBright(` ${t} `)),
	} as const;

	/**
	 * Membuat array Spark dengan nama dan value sesuai kategori dan bintang.
	 *
	 * Fungsi ini menerima array Sparks dasar (misal Blue, Pink, Green, White) dan
	 * menghasilkan array baru dengan nama Sparks yang sudah ditambahkan bintang
	 * (1★–N★) sesuai `starCount`.
	 *
	 * @param arr  - Array Sparks dasar.
	 * @param type - Tipe Sparks.
	 * @returns Array Sparks yang sudah diformat dengan bintang.
	 */
	const makeSparks = (arr: Option<number>[], type: keyof typeof color) =>
		arr.flatMap(({ name, value }) =>
			Array.from({ length: value.toString().length === 8 ? 3 : 9 }, (_, i) => ({
				name: color[type](`${i + 1}${chalk.yellow('★')} ${name}`),
				value: value + i,
			}))
		);

	const opts: Option<number>[] = [...makeSparks(blueSparkOptions, 'blue'), ...makeSparks(pinkSparkOptions, 'pink'), ...makeSparks(greenSparkOptions, 'green'), ...makeSparks(whiteSparkOptions, 'white')];

	return sparks.map((s) => opts.find((o) => o.value === s)?.name ?? '?').join(' | ');
};

/**
 * Mengambil nama dasar dari string dengan menghapus bagian dalam tanda kurung.
 *
 * Fungsi ini membersihkan string dengan menghapus teks apa pun di dalam tanda
 * kurung beserta spasi di sekitarnya, lalu memangkas spasi berlebih di awal
 * dan akhir.
 *
 * @param name - Nama asli yang mungkin mengandung teks dalam tanda kurung.
 * @returns Nama yang sudah dibersihkan tanpa bagian dalam tanda kurung.
 */
export const getBaseName = (name: string) => name.replace(/\s*\(.*?\)\s*/g, '').trim();

/**
 * Export data hasil pencarian ke file CSV atau JSON.
 *
 * Fungsi ini membuat folder "exports" dengan subfolder "csv" atau "json",
 * lalu menyimpan file di dalamnya dengan nama "uma-trainer-results".
 *
 * @param data - Array data hasil pencarian.
 * @param format - Format file: 'csv' atau 'json'.
 * @returns Nama file yang dibuat jika sukses, atau `null` jika gagal/tdk dibuat.
 */
export const exportData = (data: SearchResult[], format: 'csv' | 'json'): string | null => {
	try {
		const dir = path.join('exports', format);

		fs.mkdirSync(dir, { recursive: true });

		const now = new Date();
		const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
		const filename = path.join(dir, `uma-trainer-results-${timestamp}.${format}`);

		if (format === 'json') {
			fs.writeFileSync(filename, JSON.stringify(data, null, 2));
		} else {
			const headers = 'Account ID,Trainer Name,Grandsire,Granddam,Support Card,Sparks\n';
			const rows = data
				.map(
					(d) =>
						`"${d.account_id}","${d.trainer_name}","${traineeMap[d?.inheritance?.parent_left_id ?? -1] ?? d?.inheritance?.parent_left_id?.toString() ?? '-'}","${traineeMap[d?.inheritance?.parent_right_id ?? -1] ?? d?.inheritance?.parent_right_id?.toString() ?? '-'}","${formatSupportCard(d.support_card)}","${formatSpark([...(d?.inheritance?.blue_sparks ?? []), ...(d?.inheritance?.pink_sparks ?? []), ...(d?.inheritance?.green_sparks ?? []), ...(d?.inheritance?.white_sparks ?? [])])}"`
				)
				.join('\n');

			fs.writeFileSync(filename, headers + rows);
		}

		return filename;
	} catch (error) {
		console.error(`❌ Gagal mengekspor data: ${error instanceof Error ? error.message : 'Unknown error'}`);
		return null;
	}
};
