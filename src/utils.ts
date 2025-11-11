import chalk from 'chalk';

import { blueSparkOptions, greenSparkOptions, pinkSparkOptions, supportCardOptions, traineeOptions, whiteSparkOptions } from './constants';
import type { Option, SupportCard, SupportData } from './types';

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
	/**
	 * Membuat array Spark dengan nama dan value sesuai kategori dan bintang.
	 *
	 * Fungsi ini menerima array Sparks dasar (misal Blue, Pink, Green, White) dan
	 * menghasilkan array baru dengan nama Sparks yang sudah ditambahkan bintang
	 * (1★–N★) sesuai `starCount`.
	 *
	 * @param arr - Array Sparks dasar.
	 * @returns Array Sparks yang sudah diformat dengan bintang.
	 */
	const makeSparks = (arr: Option<number>[]) =>
		arr.flatMap(({ name, value }) => {
			const maxStars = value.toString().length === 8 ? 3 : 9;
			return Array.from({ length: maxStars }, (_, i) => ({
				name: `${i + 1}${chalk.yellow('★')} ${name}`,
				value: value + i,
			}));
		});

	const sparkOptions: Option<number>[] = [...makeSparks(blueSparkOptions), ...makeSparks(pinkSparkOptions), ...makeSparks(greenSparkOptions), ...makeSparks(whiteSparkOptions)];

	return sparks
		.map((s) => {
			const opt = sparkOptions.find((o) => o.value === s);
			return opt ? opt.name : '?';
		})
		.join(' | ');
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
