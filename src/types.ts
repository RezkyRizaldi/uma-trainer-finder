/** Bentuk halaman API. */
export interface ApiResponse {
	/** data payload. */
	items?: SearchResult[];

	/** total data. */
	total: string; // numeric string

	/** nomor halaman yang aktif saat ini. */
	page: number;

	/** batas total fetch per halaman. */
	limit: number;

	/** total halaman. */
	total_pages: number;
}

/** Struktur data error handling API. */
export interface ApiError {
	/** Pesan error singkat. */
	error: string;

	/** HTTP status code. */
	status: number;

	/** Detail tambahan (opsional). */
	details?: string;
}

/** Struktur data hasil pencarian API. */
export interface SearchResult {
	/** ID akun trainer. */
	account_id: string; // numeric string

	/** Nama akun trainer. */
	trainer_name: string;

	/** Jumlah follower akun trainer. */
	follower_num: number | null;

	borrow_view_count: number; // int64

	borrow_copy_count: number; // int64

	last_updated: string | null; // date-time

	/** Informasi grandsire dan granddam (opsional). */
	inheritance?: InheritanceData;

	/** Informasi kartu support (opsional). */
	support_card?: SupportData;
}

/** Struktur data inheritance dari API. */
export interface InheritanceData {
	/** ID inheritance. */
	inheritance_id: number;

	/** ID akun trainer. */
	account_id: string; // numeric string

	/** ID sire. */
	main_parent_id: number;

	/** ID grandsire. */
	parent_left_id: number;

	/** ID granddam. */
	parent_right_id: number;

	/** Status peringkat sire (dalam angka). */
	parent_rank: number;

	/** Status kelangkaan sire (dalam angka). */
	parent_rarity: number;

	/** Daftar blue spark (stats). */
	blue_sparks: number[];

	/** Daftar pink spark (aptitude). */
	pink_sparks: number[];

	/** Daftar green spark (unique skill). */
	green_sparks: number[];

	/** Daftar white spark (skill). */
	white_sparks: number[];

	/** Jumlah kemenangan balapan G1. */
	win_count: number;

	/** Jumlah white spark (skill) yang dimiliki. */
	white_count: number;

	/** Blue spark (stats) utama. */
	main_blue_factors: number;

	/** Pink spark (aptitude) utama. */
	main_pink_factors: number;

	/** Green spark (unique skill) utama. */
	main_green_factors: number;

	/** white spark (skill) utama. */
	main_white_factors: number[];

	/** Jumlah white spark (skill) utama. */
	main_white_count: number;

	/** Jumlah nilai afinitas. */
	affinity_score: number | null;
}

/** Struktur support data dari API (dalam hasil search). */
export interface SupportData {
	/** ID akun trainer. */
	account_id: string;

	/** ID support card. */
	support_card_id: number;

	/** Level limit break. */
	limit_break_count: number | null;

	/** Jumlah exp support card. */
	experience: number;
}

/**
 * Representasi generic option untuk menu pilihan interaktif.
 *
 * `status` hanya diisi untuk data trainee dari `constants.ts`.
 * Item navigasi (aksi menu) tidak mengisi `status` sehingga nilainya `undefined`.
 */
export interface Option<T> {
	/** Nama yang ditampilkan ke user. */
	name: string;

	/** Nilai yang dikembalikan saat opsi dipilih. */
	value: T;

	/** Status ketersediaan karakter; tidak diisi untuk item navigasi. */
	status?: 'released' | 'upcoming' | 'unreleased';
}

/** Tingkat kelangkaan kartu support. */
export type SupportCardRarity = 'SSR' | 'SR' | 'R';

/** Tipe kartu support. */
export type SupportCardType = 'Speed' | 'Stamina' | 'Power' | 'Guts' | 'Wit' | 'Pal' | 'Group';

/** Representasi kartu support. */
export interface SupportCard {
	/** Nama kartu support. */
	name: string;

	/** ID unik kartu support. */
	value: number;

	/** Tingkat kelangkaan kartu support. */
	rarity: SupportCardRarity;

	/** Tipe kartu support. */
	type: SupportCardType;
}

/** Struktur query untuk menyortir urutan data hasil pencarian. */
export type SearchSortingQuery = 'trending' | 'affinity_score' | 'win_count' | 'white_count' | 'blue_stars_sum' | 'pink_stars_sum' | 'green_stars_sum' | 'white_stars_sum' | 'parent_rank' | 'last_updated';

/** Struktur query untuk menyortir tipe data hasil pencarian. */
export type SearchTypeQuery = 'inheritance' | 'support_cards' | 'all';

/** Tipe export data */
export type ExportType = 'csv' | 'json';

/** Struktur opsi CLI yang diterima dari user. */
export interface CLIOptions {
	sort?: SearchSortingQuery;
	export?: ExportType;
}
