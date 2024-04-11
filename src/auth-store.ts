import { createStore } from "zustand/vanilla";
import { devtools } from "zustand/middleware";
import { z } from "zod";
import { jwtDecode } from "jwt-decode";
import CookieService from "./cookie-service";

import { useStore } from "zustand";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

const role = z.enum(["admin", "user"]);

type Role = z.infer<typeof role>;

const TokenDataSchema = z.object({
	userId: z.string(),
	roles: z.array(role),
});

type TokenData = z.infer<typeof TokenDataSchema>;

type AuthStore = {
	accessToken: string | undefined;
	accessTokenData: TokenData | undefined;
	refreshToken: string | undefined;

	actions: {
		setAccessToken: (accessToken: string | undefined) => void;
		setRefreshToken: (refreshToken: string | undefined) => void;
		// set tokens on the app start
		init: () => void;
		clearTokens: () => void;
	};
};

export const decodeAccessToken = (accessToken: string) =>
	TokenDataSchema.parse(jwtDecode<TokenData>(accessToken));

const authStore = createStore<AuthStore>()(
	devtools(
		(set, get) => ({
			accessToken: undefined,
			accessTokenData: undefined,
			refreshToken: undefined,

			// If you want to persist the store, omit the actions
			/**
			 * import { omit } from "remeda"
			 * {
			 * 		name: "auth-store",
			 * 		storage: createJSONStorage(() => sessionStorage),
			 * 		partialize: (state) => {
			 * 			return omit(state, ["actions"]);
			 * 		},
			 * 	}
			 */
			actions: {
				setAccessToken: (accessToken: string | undefined) => {
					const accessTokenData = (() => {
						try {
							return accessToken ? decodeAccessToken(accessToken) : undefined;
						} catch (error) {
							console.error(error);
							return undefined;
						}
					})();
					set({
						accessToken,
						accessTokenData,
					});
				},
				setRefreshToken: (refreshToken: string | undefined) =>
					set({
						refreshToken,
					}),
				init: () => {
					const {setAccessToken, setRefreshToken} = get().actions;
					setAccessToken(CookieService.get(ACCESS_TOKEN_KEY));
					setRefreshToken(CookieService.get(REFRESH_TOKEN_KEY));
				},
				clearTokens: () =>
					set({
						accessToken: undefined,
						accessTokenData: undefined,
						refreshToken: undefined,
					}),
			},
		}),
		{
			name: "auth-store",
			enabled: !import.meta.env.PROD,
		}
	)
);

/**
 * Required for zustand stores, as the lib doesn't expose this type
 */
export type ExtractState<S> = S extends {
		getState: () => infer T;
	}
	? T
	: never;

type Params<U> = Parameters<typeof useStore<typeof authStore, U>>;

// Selectors
const accessTokenSelector = (state: ExtractState<typeof authStore>) =>
	state.accessToken;
const accessTokenDataSelector = (state: ExtractState<typeof authStore>) =>
	state.accessTokenData;
const refreshTokenSelector = (state: ExtractState<typeof authStore>) =>
	state.refreshToken;
const actionsSelector = (state: ExtractState<typeof authStore>) =>
	state.actions;

// getters
export const getAccessToken = () => accessTokenSelector(authStore.getState());
export const getAccessTokenData = () =>
	accessTokenDataSelector(authStore.getState());
export const getRefreshToken = () => refreshTokenSelector(authStore.getState());
export const getActions = () => actionsSelector(authStore.getState());

function useAuthStore<U>(selector: Params<U>[1], equalityFn?: Params<U>[2]) {
	return useStore(authStore, selector, equalityFn);
}

// Hooks
export const useAccessToken = () => useAuthStore(accessTokenSelector);
export const useAccessTokenData = () => useAuthStore(accessTokenDataSelector);
export const useRefreshToken = () => useAuthStore(refreshTokenSelector);
export const useActions = () => useAuthStore(actionsSelector);
