import * as fs from 'fs';
import * as path from 'path';

import chalk from 'chalk';
import stripAnsi from 'strip-ansi';

import { blueSparkOptions, greenSparkOptions, pinkSparkOptions, supportCardOptions, traineeOptions, whiteSparkOptions } from './constants';
import type { ExportType, Option, SearchResult, SupportCard, SupportData } from './types';

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

	const limitBreak = data.limit_break_count ?? 0;
	return `${c.name} [${formattedType}] (${c.rarity}${limitBreak > 0 ? ` ${chalk.yellow('★'.repeat(limitBreak))}` : ''})`;
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
			})),
		);

	const opts: Option<number>[] = [...makeSparks(blueSparkOptions, 'blue'), ...makeSparks(pinkSparkOptions, 'pink'), ...makeSparks(greenSparkOptions, 'green'), ...makeSparks(whiteSparkOptions, 'white')];

	return sparks.map((s) => opts.find((o) => o.value === s)?.name ?? '?').join(' | ');
};

/**
 * Konversi nilai `parent_rank` dari API menjadi label rank yang dapat dibaca.
 *
 * Menggunakan tabel ambang batas rank yang didefinisikan secara statis dan
 * diurutkan dari nilai tertinggi ke terendah agar pencarian cukup dengan
 * iterasi `find` pertama yang cocok.
 *
 * @param score - Nilai `parent_rank` dari data inheritance.
 * @returns Label rank dalam format string (contoh: `"SS+"`, `"UG³"`, `"LF²⁴"`).
 */
export const getRankLabel = (score: number): string => {
	const THRESHOLDS: [number, string][] = [
		[104_800, 'LF²⁴'],
		[104_300, 'LF²³'],
		[103_800, 'LF²²'],
		[103_200, 'LF²¹'],
		[102_700, 'LF²⁰'],
		[102_200, 'LF¹⁹'],
		[101_700, 'LF¹⁸'],
		[101_100, 'LF¹⁷'],
		[100_600, 'LF¹⁶'],
		[100_100, 'LF¹⁵'],
		[99_600, 'LF¹⁴'],
		[99_000, 'LF¹³'],
		[98_500, 'LF¹²'],
		[98_000, 'LF¹¹'],
		[97_500, 'LF¹⁰'],
		[96_900, 'LF⁹'],
		[96_300, 'LF⁸'],
		[95_600, 'LF⁷'],
		[94_600, 'LF⁶'],
		[94_000, 'LF⁵'],
		[93_400, 'LF⁴'],
		[92_800, 'LF³'],
		[92_200, 'LF²'],
		[91_600, 'LF¹'],
		[91_000, 'LF'],
		[90_400, 'LG²⁴'],
		[89_800, 'LG²³'],
		[89_200, 'LG²²'],
		[88_600, 'LG²¹'],
		[88_000, 'LG²⁰'],
		[87_400, 'LG¹⁹'],
		[86_800, 'LG¹⁸'],
		[86_200, 'LG¹⁷'],
		[85_600, 'LG¹⁶'],
		[85_000, 'LG¹⁵'],
		[84_400, 'LG¹⁴'],
		[83_800, 'LG¹³'],
		[83_200, 'LG¹²'],
		[82_600, 'LG¹¹'],
		[82_000, 'LG¹⁰'],
		[81_400, 'LG⁹'],
		[80_800, 'LG⁸'],
		[80_200, 'LG⁷'],
		[79_600, 'LG⁶'],
		[79_000, 'LG⁵'],
		[78_400, 'LG⁴'],
		[77_800, 'LG³'],
		[77_200, 'LG²'],
		[76_600, 'LG¹'],
		[75_300, 'LG'],
		[74_400, 'US⁹'],
		[73_000, 'US⁸'],
		[71_600, 'US⁷'],
		[70_300, 'US⁶'],
		[69_000, 'US⁵'],
		[67_700, 'US⁴'],
		[66_400, 'US³'],
		[65_100, 'US²'],
		[64_200, 'US¹'],
		[63_400, 'US'],
		[62_500, 'UA⁹'],
		[61_700, 'UA⁸'],
		[60_800, 'UA⁷'],
		[60_000, 'UA⁶'],
		[59_200, 'UA⁵'],
		[58_400, 'UA⁴'],
		[57_500, 'UA³'],
		[56_700, 'UA²'],
		[55_900, 'UA¹'],
		[55_200, 'UA'],
		[54_400, 'UB⁹'],
		[53_600, 'UB⁸'],
		[52_800, 'UB⁷'],
		[52_000, 'UB⁶'],
		[51_300, 'UB⁵'],
		[50_500, 'UB⁴'],
		[49_800, 'UB³'],
		[49_000, 'UB²'],
		[48_300, 'UB¹'],
		[47_600, 'UB'],
		[46_900, 'UC⁹'],
		[46_200, 'UC⁸'],
		[45_400, 'UC⁷'],
		[44_700, 'UC⁶'],
		[44_000, 'UC⁵'],
		[43_400, 'UC⁴'],
		[42_700, 'UC³'],
		[42_000, 'UC²'],
		[41_300, 'UC¹'],
		[40_700, 'UC'],
		[40_000, 'UD⁹'],
		[39_400, 'UD⁸'],
		[38_700, 'UD⁷'],
		[38_100, 'UD⁶'],
		[37_500, 'UD⁵'],
		[36_800, 'UD⁴'],
		[36_200, 'UD³'],
		[35_600, 'UD²'],
		[35_000, 'UD¹'],
		[34_400, 'UD'],
		[33_800, 'UE⁹'],
		[33_200, 'UE⁸'],
		[32_700, 'UE⁷'],
		[32_100, 'UE⁶'],
		[31_500, 'UE⁵'],
		[31_000, 'UE⁴'],
		[30_400, 'UE³'],
		[29_900, 'UE²'],
		[29_400, 'UE¹'],
		[28_800, 'UE'],
		[28_300, 'UF⁹'],
		[27_800, 'UF⁸'],
		[27_300, 'UF⁷'],
		[26_800, 'UF⁶'],
		[26_300, 'UF⁵'],
		[25_800, 'UF⁴'],
		[25_300, 'UF³'],
		[24_800, 'UF²'],
		[24_300, 'UF¹'],
		[23_900, 'UF'],
		[23_400, 'UG⁹'],
		[23_000, 'UG⁸'],
		[22_500, 'UG⁷'],
		[22_100, 'UG⁶'],
		[21_600, 'UG⁵'],
		[21_200, 'UG⁴'],
		[20_800, 'UG³'],
		[20_400, 'UG²'],
		[20_000, 'UG¹'],
		[19_600, 'UG'],
		[19_200, 'SS+'],
		[17_500, 'SS'],
		[15_900, 'S+'],
		[14_500, 'S'],
		[12_100, 'A+'],
		[10_000, 'A'],
		[8_200, 'B+'],
		[6_500, 'B'],
		[4_900, 'C+'],
		[3_500, 'C'],
		[2_900, 'D+'],
		[2_300, 'D'],
		[1_800, 'E+'],
		[1_300, 'E'],
		[900, 'F+'],
		[600, 'F'],
		[300, 'G+'],
		[0, 'G'],
	];

	return THRESHOLDS.find(([min]) => score >= min)?.[1] ?? '?';
};

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
export const exportData = (data: SearchResult[], format: ExportType): string | null => {
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
						`"${d.account_id}","${d.trainer_name}","${traineeMap[d?.inheritance?.parent_left_id ?? -1] ?? d?.inheritance?.parent_left_id?.toString() ?? '-'}","${traineeMap[d?.inheritance?.parent_right_id ?? -1] ?? d?.inheritance?.parent_right_id?.toString() ?? '-'}","${stripAnsi(formatSupportCard(d.support_card))}","${stripAnsi(formatSpark([...(d?.inheritance?.blue_sparks ?? []), ...(d?.inheritance?.pink_sparks ?? []), ...(d?.inheritance?.green_sparks ?? []), ...(d?.inheritance?.white_sparks ?? [])]))}"`,
				)
				.join('\n');

			fs.writeFileSync(filename, headers + rows);
		}

		return filename;
	} catch (error) {
		console.error(`❌ Gagal mengekspor data: ${error instanceof Error ? error.message : 'Unknown error'}.`);

		return null;
	}
};
