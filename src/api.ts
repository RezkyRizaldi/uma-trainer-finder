import type { ApiError, ApiResponse, SearchSortingQuery, SearchTypeQuery } from './types';

/**
 * Mengambil data pencarian dari API uma.moe.
 *
 * Saat respons bukan 2xx, body JSON di-parse sebagai `ApiError`
 * (`#/components/schemas/Error`) untuk menghasilkan pesan error yang informatif.
 * Jika body tidak bisa di-parse sebagai JSON, fallback ke status text.
 *
 * @param page          - Nomor halaman (0-indexed, sesuai spec API).
 * @param limit         - Jumlah item per halaman (maks. 100).
 * @param searchType    - Tipe data yang dicari: `'inheritance'`, `'support_cards'`, atau `'all'`.
 * @param sortBy        - Field pengurutan hasil pencarian.
 * @param playerCharaId - ID karakter trainee untuk filter dan kalkulasi afinitas (opsional).
 * @returns Response API berisi array item dan metadata paginasi.
 * @throws Error dengan pesan dari `ApiError.error` (dan `ApiError.details` jika ada) saat HTTP error.
 */
export const fetchSearch = async (page: number = 0, limit: number = 20, searchType: SearchTypeQuery = 'all', sortBy: SearchSortingQuery = 'affinity_score', playerCharaId?: number | string): Promise<ApiResponse> => {
	const apiKey = process.env.UMA_MOE_API_KEY;

	if (!apiKey) {
		console.warn('Warning: UMA_MOE_API_KEY tidak ditemukan. Permintaan API mungkin ditolak.');
	}

	const params = new URLSearchParams({
		page: String(page),
		limit: String(limit),
		search_type: searchType,
		sort_by: sortBy,
		sort_order: 'desc',
		max_follower_num: '999',
	});

	if (playerCharaId !== undefined && playerCharaId !== null) {
		params.set('player_chara_id', String(playerCharaId));
	}

	const res = await fetch(`https://uma.moe/api/v3/search?${params.toString()}`, {
		headers: apiKey ? { 'X-API-Key': apiKey } : {},
	});

	if (!res.ok) {
		try {
			const body = (await res.json()) as ApiError;
			const message = body.details ? `${body.error} — ${body.details}` : body.error;

			throw new Error(`[${body.status}] ${message}`);
		} catch (parseErr) {
			if (parseErr instanceof Error && parseErr.message.startsWith('[')) throw parseErr;

			throw new Error(`[${res.status}] ${res.statusText}`, { cause: parseErr });
		}
	}

	return (await res.json()) as ApiResponse;
};
