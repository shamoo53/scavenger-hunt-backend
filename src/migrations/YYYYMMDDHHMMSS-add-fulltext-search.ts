import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFulltextSearch1234567890123 implements MigrationInterface {
  name = 'AddFulltextSearch1234567890123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add tsvector column for full-text search
    await queryRunner.query(`
      ALTER TABLE puzzle 
      ADD COLUMN search_vector tsvector
    `);

    // Create function to update search vector
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_puzzle_search_vector()
      RETURNS trigger AS $$
      BEGIN
        NEW.search_vector := 
          setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
          setweight(to_tsvector('english', COALESCE(NEW.clues, '')), 'B') ||
          setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger to automatically update search vector
    await queryRunner.query(`
      CREATE TRIGGER puzzle_search_vector_update
      BEFORE INSERT OR UPDATE ON puzzle
      FOR EACH ROW
      EXECUTE FUNCTION update_puzzle_search_vector();
    `);

    // Create GIN index for better search performance
    await queryRunner.query(`
      CREATE INDEX puzzle_search_vector_idx ON puzzle USING GIN(search_vector);
    `);

    // Update existing records
    await queryRunner.query(`
      UPDATE puzzle SET 
        search_vector = 
          setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
          setweight(to_tsvector('english', COALESCE(clues, '')), 'B') ||
          setweight(to_tsvector('english', COALESCE(array_to_string(tags, ' '), '')), 'C')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS puzzle_search_vector_update ON puzzle;`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS update_puzzle_search_vector();`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS puzzle_search_vector_idx;`);
    await queryRunner.query(
      `ALTER TABLE puzzle DROP COLUMN IF EXISTS search_vector;`,
    );
  }
}
