import { type Writable, writable } from 'svelte/store';
import * as devalue from 'devalue';

const prefix = 'screen-recorder';

/**
 * Creates a store that saves/loads its value to/from a storage.
 * The value has to be `devalue` serializable.
 * @param storage The storage to use.
 * @param keySuffix The key suffix to use for a storage.
 * @param initial The start value of the store if no value is stored.
 * @param options Additional options for the store.
 */
function storageStore<T>(
	storage: Storage,
	keySuffix: string,
	initial: T,
	options?: Partial<StorageStoreOptions<T>>,

): StorageStore<T>
{
	const key = getKey(keySuffix);
	const loadedValue = storage.getItem(key);

	const resolvedOptions: StorageStoreOptions<T> = {
		version: 0,
		migrations: {},
		storeDelay: 0,
		onSerialize: x => x,
		onDeserialize: x => x,
		...options,
	};

	let storeValue: StorageValue<T> = {
		v: resolvedOptions.version,
		d: initial,
	};

	if (loadedValue != null)
	{
		storeValue = devalue.parse(loadedValue) as StorageValue<any>;
		migrate(storeValue, resolvedOptions, initial)

		storeValue.d = resolvedOptions.onDeserialize(storeValue.d);
	}

	const store = writable<T>(storeValue.d);

	let updateHandle: number | undefined = undefined;
	store.subscribe(value =>
	{
		clearTimeout(updateHandle);

		const storeValue: StorageValue<T> =
		{
			v: resolvedOptions.version,
			d: resolvedOptions.onSerialize(value),
		};

		const update = () => storage.setItem(key, devalue.stringify(storeValue));

		if (resolvedOptions.storeDelay == 0)
			update()
		else
			updateHandle = window.setTimeout(update, resolvedOptions.storeDelay);
	});

	return {
		key,
		...store,
		clear: () => storage.removeItem(key),
	};
}

/**
 * Creates a store that saves/loads its value to/from session storage.
 * The value has to be `devalue` serializable.
 * @param keySuffix The key suffix to use for session storage.
 * @param initial The start value of the store if no value is stored.
 * @param options Additional options for the store.
 */
export function sessionStorageStore<T>(
	keySuffix: string,
	initial: T,
	options?: Partial<StorageStoreOptions<T>>,
): StorageStore<T>
{
	return storageStore(
		sessionStorage,
		keySuffix,
		initial,
		options,
	);
}

/**
 * Creates a store that saves/loads its value to/from local storage.
 * The value has to be `devalue` serializable.
 * @param keySuffix The key suffix to use for local storage.
 * @param initial The start value of the store if no value is stored.
 * @param options Additional options for the store.
 */
export function localStorageStore<T>(
	keySuffix: string,
	initial: T,
	options?: Partial<StorageStoreOptions<T>>,
): StorageStore<T>
{
	return storageStore(
		localStorage,
		keySuffix,
		initial,
		options,
	);
}

export interface StorageStore<T> extends Writable<T>
{
	/**
	 * The full key used to store the value.  
	 * Value is wrapped in @see {StorageValue<T>}
	 */
	readonly key: string;

	/**
	 * Removes the value from storage.
	 */
	clear(): void;
}

/**
 * Migrates a storage value, if necessary. 
 */
function migrate<T>(
	value: StorageValue<T>,
	options: StorageStoreOptions<T>,
	fallback: T,
)
{
	if (value.v == options.version)
		return;

	while (value.v < options.version)
	{
		const migration = options.migrations[value.v];

		if (migration == null)
		{
			reset();
			return;
		}
		else
		{
			try
			{
				value.d = migration(value.d);
				value.v++;
			}
			catch
			{
				reset();
				return;
			}
		}
	}

	function reset()
	{
		value.v = options.version;
		value.d = fallback;
	}
}

/**
 * Gets the full key used to store data in a storage.
 * @param suffix The suffix of the key.
 */
function getKey(suffix: string)
{
	return `${prefix}.stores.${suffix}`;
}

/**
 * Interface for store initialization options.
 */
export interface StorageStoreOptions<T>
{
	/**
	 * The version of the data's format.  
	 * Default: `0`
	 */
	version: number;

	/**
	 * A mapping of migrations that can be applied if the stored value
	 * is of an earlier version.
	 *
	 * The keys are previous version numbers and the values are functions
	 * that transform the value to next higher version.
	 *
	 * If no migrations exist, the outdated value is discarded.
	 */
	migrations: Record<number, (value: any) => any>;

	/**
	 * Write delay in milliseconds.  
	 * Can be used to prevent frequent store updates.
	 * Update happens synchronously if set to `0`.  
	 * Default: `0`
	 */
	storeDelay: number;

	/**
	 * Function that can be used to transform the value
	 * prior to `devalue` serialization.  
	 * Default: `x => x`
	 */
	onSerialize: (value: T) => any;

	/**
	 * Function that can be used to transform the value
	 * after `devalue` deserialization.  
	 * Function is called after any migrations.
	 * Default: `x => x`
	 */
	onDeserialize: (value: any) => T;
}

interface StorageValue<T>
{
	/**
	 * The version of the data's format.
	 */
	v: number;

	/**
	 * The data.
	 */
	d: T;
}
