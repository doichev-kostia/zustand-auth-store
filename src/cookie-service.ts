import Cookies from 'js-cookie';
import { type z, type ZodType } from 'zod';

type GetOptions = {
	parseJSON?: boolean;
	validationSchema?: ZodType;
};

type ReturnType<O extends GetOptions> = O['parseJSON'] extends true
	? O['validationSchema'] extends ZodType
		? z.infer<O['validationSchema']> | undefined
		: unknown
	: string | undefined;

class CookieService {
	/**
	 * Method to get a cookie value. Can parse the value as JSON and validate it against a schema. If the validation fails, it will throw an exception. If the cookie is not found, it will return undefined.
	 */
	public static get<Options extends GetOptions>(
		key: string,
		options?: Options
	): ReturnType<Options> {
		const value = Cookies.get(key);

		if (typeof value === 'undefined') return value;

		let mutatedValue = value;

		if (options?.parseJSON) {
			try {
				mutatedValue = JSON.parse(value);
				// eslint-disable-next-line no-empty
			} catch (e) {}
		}

		if (options?.validationSchema) {
			return options.validationSchema.parse(mutatedValue);
		}

		return mutatedValue;
	}

	public static getAll() {
		return Cookies.get();
	}

	public static set<T>(
		key: string,
		value: T,
		options?: Cookies.CookieAttributes
	) {
		const stringValue =
			typeof value === 'string' ? value : JSON.stringify(value);
		return Cookies.set(key, stringValue, options);
	}

	public static remove(key: string, options?: Cookies.CookieAttributes) {
		return Cookies.remove(key, options);
	}
}

export default CookieService;
