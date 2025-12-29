import type { ApiResponse, SearchResult, SearchSortingQuery } from './types';

/**
 * Cache untuk menyimpan hasil fetch API per halaman berdasarkan parameter.
 */
const cache = new Map<string, ApiResponse>();

/**
 * Fetch data dari API (inheritance search, banyak halaman).
 *
 * @param sire  		- ID sire.
 * @param gSire 		- ID grandsire (null/skip bila tidak ada filter).
 * @param gDam  		- ID granddam (null/skip bila tidak ada filter).
 * @param startPage - Halaman awal untuk fetch.
 * @param sortBy 		- Query untuk sorting.
 * @returns Kumpulan hasil pencarian.
 */
export const fetchAllPages = async (sire: number, gSire: number | null = null, gDam: number | null = null, startPage: number = 0, sortBy: SearchSortingQuery = 'parent_rank'): Promise<SearchResult[]> => {
	try {
		const results = await Promise.all(
			Array.from({ length: 10 }).map(async (_, i) => {
				const page = startPage + i;
				const key = `${sire}-${gSire || 'null'}-${gDam || 'null'}-${sortBy}-${page}`;

				if (cache.has(key)) {
					return cache.get(key)!;
				}

				const response = await fetch(`https://uma.moe/api/v3/search?page=${page}&limit=12&search_type=inheritance&main_parent_id=${sire}&sort_by=${sortBy}&sort_order=desc&max_follower_num=1000`);

				const data: ApiResponse = response.ok ? ((await response.json()) as ApiResponse) : { items: [], total: 0, page, limit: 0, total_pages: 0 };

				cache.set(key, data);

				return data;
			})
		);
		return results
			.flatMap((p) => p.items || [])
			.filter(({ inheritance }) => {
				if (!inheritance) return false;

				const { parent_left_id: l, parent_right_id: r } = inheritance;

				if (gSire !== null && gDam !== null) return (l === gSire && r === gDam) || (l === gDam && r === gSire);

				if (gSire !== null && gDam === null) return l === gSire || r === gSire;

				return true;
			});
	} catch {
		return [];
	}
};
