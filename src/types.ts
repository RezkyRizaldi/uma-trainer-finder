/** Bentuk halaman API. */
export interface ApiResponse {
	/** data payload. */
	items?: SearchResult[];

	/** total data. */
	total: number;

	/** nomor halaman yang aktif saat ini. */
	page: number;

	/** batas total fetch per halaman. */
	limit: number;

	/** total halaman. */
	total_pages: number;
}

/** Struktur data hasil pencarian API. */
export interface SearchResult {
	/** ID akun trainer. */
	account_id: string;

	/** Nama akun trainer. */
	trainer_name: string;

	/** Jumlah follower akun trainer. */
	follower_num: number;

	/** Informasi grandsire dan granddam (opsional). */
	inheritance?: InheritanceData;

	/** nformasi kartu support (opsional). */
	support_card?: SupportData;
}

/** Struktur data inheritance dari API. */
export interface InheritanceData {
	/** ID inheritance. */
	inheritance_id: number;

	/** ID akun trainer. */
	account_id: number;

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
	main_blue_factors: number[];

	/** Pink spark (aptitude) utama. */
	main_pink_factors: number[];

	/** Green spark (unique skill) utama. */
	main_green_factors: number[];

	/** white spark (skill) utama. */
	main_white_factors: number[];

	/** Jumlah white spark (skill) utama. */
	main_white_count: number;
}

/** Struktur support data dari API (dalam hasil search). */
export interface SupportData {
	/** ID akun trainer. */
	account_id: number;

	/** ID support card. */
	support_card_id: number;

	/** Level limit break. */
	limit_break_count: number;

	/** Jumlah exp support card. */
	experience: number;
}

/** Struktur pilihan khusus untuk menu navigasi. */
export type SpecialValue = 'skip' | 'next' | 'stop' | '__toggleUpcoming' | null;

/** Representasi generic option (untuk menu pilihan interaktif). */
export interface Option<T> {
	/** Nama data yang ditampilkan ke user. */
	name: string;

	/** ID option. */
	value: T;

	/** Status ketersediaan dari data (opsional). */
	status?: 'released' | 'upcoming' | 'unreleased';
}

/** Struktur pilihan biasa + pilihan khusus untuk menu navigasi. */
export type OptionWithSpecial<T> = Option<T | SpecialValue>;

/** Tingkat kelangkaan kartu support. */
export type SupportCardRarity = 'SSR' | 'SR' | 'R';

/** Tipe kartu support. */
export type SupportCardType = 'Speed' | 'Stamina' | 'Power' | 'Guts' | 'Wit' | 'Friend' | 'Group';

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
export type SearchSortingQuery = 'parent_rank' | 'win_count' | 'white_count' | 'last_updated';
