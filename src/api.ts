import type { ApiResponse, SearchResult, SearchSortingQuery } from './types';

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
		return (
			await Promise.all(
				Array.from({ length: 10 }).map((_, i) =>
					fetch(`https://uma.moe/api/v3/search?page=${startPage + i}&limit=12&search_type=inheritance&main_parent_id=${sire}&sort_by=${sortBy}&sort_order=desc&max_follower_num=1000`).then((r) =>
						(r.ok ? (r.json() as Promise<ApiResponse>) : Promise.resolve({ items: [], total: 0, page: 0, limit: 0, total_pages: 0 } as ApiResponse)).catch(() => ({ items: [], total: 0, page: 0, limit: 0, total_pages: 0 }) as ApiResponse)
					)
				)
			)
		)
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
