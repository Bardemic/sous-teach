import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1763314243135 implements MigrationInterface {
    name = 'AutoMigration1763314243135'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "newsletter_subscribers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying(255) NOT NULL,
                "zipCode" character varying(10),
                "city" character varying(100),
                "state" character varying(100),
                "confirmed" boolean NOT NULL DEFAULT false,
                "confirmationToken" character varying(255),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "confirmedAt" TIMESTAMP,
                CONSTRAINT "PK_38f9333e9961b2fdb589128d19b" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_0dc48416511f011f7de7b2a8f8" ON "newsletter_subscribers" ("email")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."IDX_0dc48416511f011f7de7b2a8f8"
        `);
        await queryRunner.query(`
            DROP TABLE "newsletter_subscribers"
        `);
    }

}
