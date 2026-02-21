import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'cms.db'));

try {
    const posts = db.prepare('SELECT id, title, slug, published FROM blog_posts').all();
    console.log('--- LOCAL DATABASE POSTS ---');
    console.log(JSON.stringify(posts, null, 2));
    console.log('----------------------------');
} catch (error) {
    console.error('Error reading database:', error);
}
