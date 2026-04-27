/**
 * Returns a fresh in-memory DB module for each test suite.
 * Achieved by setting DB_PATH=:memory: before importing.
 */
export async function createTestDb() {
	process.env.DB_PATH = ':memory:';
	// Dynamic import ensures a fresh module each time when combined with vi.resetModules()
	const mod = await import('./db.js');
	return mod;
}
