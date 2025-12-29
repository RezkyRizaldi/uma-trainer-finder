import type { ApiResponse, SearchResult, SearchSortingQuery } from './types';

/**
 * Cache untuk menyimpan hasil fetch API per halaman berdasarkan parameter unik.
 * Mengurangi jumlah request berulang untuk performa yang lebih baik.
 */
const cache = new Map<string, ApiResponse>();

/**
 * Mengambil data hasil pencarian inheritance dari API secara paralel untuk 10 halaman.
 * Menggunakan cache untuk menghindari fetch ulang, dan memfilter hasil berdasarkan grandsire dan granddam.
 *
 * @param sire      - ID sire utama.
 * @param gSire     - ID grandsire (opsional, null jika tidak ada filter).
 * @param gDam      - ID granddam (opsional, null jika tidak ada filter).
 * @param startPage - Halaman awal untuk fetch (default 0).
 * @param sortBy    - Kriteria sorting hasil (default 'parent_rank').
 * @returns Array hasil pencarian yang sudah difilter.
 */
export const fetchAllPages = async (sire: number, gSire: number | null = null, gDam: number | null = null, startPage: number = 0, sortBy: SearchSortingQuery = 'parent_rank'): Promise<SearchResult[]> => {
	try {
		const pages = Array.from({ length: 10 }, (_, i) => startPage + i);

		const responses = await Promise.all(
			pages.map(async (page) => {
				const key = `${sire}-${gSire ?? 'null'}-${gDam ?? 'null'}-${sortBy}-${page}`;

				if (cache.has(key)) return cache.get(key)!;

				const url = `https://uma.moe/api/v3/search?page=${page}&limit=12&search_type=inheritance&main_parent_id=${sire}&sort_by=${sortBy}&sort_order=desc&max_follower_num=1000`;

				const res = await fetch(url);

				if (!res.ok) {
					console.error(`API request failed: ${res.status} ${res.statusText} for page ${page}`);
				}

				const data: ApiResponse = res.ok ? ((await res.json()) as ApiResponse) : { items: [], total: 0, page, limit: 0, total_pages: 0 };

				cache.set(key, data);

				return data;
			})
		);

		return responses
			.flatMap((p) => p.items ?? [])
			.filter(({ inheritance }) => {
				if (!inheritance) return false;

				const { parent_left_id: l, parent_right_id: r } = inheritance;

				if (gSire !== null && gDam !== null) return (l === gSire && r === gDam) || (l === gDam && r === gSire);

				if (gSire !== null) return l === gSire || r === gSire;

				return true;
			});
	} catch (error) {
		console.error('Error fetching pages:', error);

		return [];
	}
};
