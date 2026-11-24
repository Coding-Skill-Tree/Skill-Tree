import { Router } from 'express';
import { pool } from '../db/pool.js';
import { sendSuccess } from '../lib/api-response.js';

export const skillsRouter = Router();

skillsRouter.get('/skills', async (_request, response, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const [catalog, categories, skills] = await Promise.all([
      client.query(
        `SELECT COALESCE(MAX(s.catalog_version), 1)::int AS version
         FROM skills s
         JOIN skill_categories c ON c.id = s.category_id
         WHERE s.active = true AND c.active = true`,
      ),
      client.query(
        `SELECT c.id, c.name, c.sort_order AS "sortOrder"
         FROM skill_categories c
         WHERE c.active = true
         ORDER BY c.sort_order, c.name`,
      ),
      client.query(
        `SELECT s.id AS "skillId", s.category_id AS "categoryId", c.name AS category,
                s.title, s.description, s.learning_items AS "learningItems",
                s.position_x AS "positionX", s.position_y AS "positionY",
                s.catalog_version AS "catalogVersion", s.sort_order AS "sortOrder",
                COALESCE(
                  jsonb_agg(sp.prerequisite_skill_id ORDER BY prerequisite.sort_order, prerequisite.title)
                    FILTER (WHERE sp.prerequisite_skill_id IS NOT NULL),
                  '[]'::jsonb
                ) AS "prerequisiteSkillIds"
         FROM skills s
         JOIN skill_categories c ON c.id = s.category_id
         LEFT JOIN skill_prerequisites sp ON sp.skill_id = s.id
         LEFT JOIN skills prerequisite ON prerequisite.id = sp.prerequisite_skill_id
         WHERE s.active = true AND c.active = true
         GROUP BY s.id, c.id, c.name
         ORDER BY c.sort_order, s.sort_order, s.title`,
      ),
    ]);
    await client.query('COMMIT');
    sendSuccess(response, {
      catalogVersion: catalog.rows[0].version,
      categories: categories.rows,
      skills: skills.rows.map(({ positionX, positionY, ...skill }) => ({
        ...skill,
        position: { x: positionX, y: positionY },
      })),
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
});
