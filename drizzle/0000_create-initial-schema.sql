CREATE TYPE "public"."copy_status" AS ENUM('DISPONIVEL', 'EMPRESTADO', 'PERDIDO', 'MANUTENCAO', 'DESCARTADO');--> statement-breakpoint
CREATE TYPE "public"."education_level" AS ENUM('FUNDAMENTAL', 'MEDIO');--> statement-breakpoint
CREATE TYPE "public"."loan_status" AS ENUM('EMPRESTADO', 'DEVOLVIDO', 'PERDIDO');--> statement-breakpoint
CREATE TABLE "authors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"nationality" text,
	"birth_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "book_authors" (
	"book_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	CONSTRAINT "book_authors_pkey" PRIMARY KEY("book_id","author_id")
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"isbn" text,
	"publisher" text,
	"publication_year" integer,
	"edition" integer,
	"page_count" integer,
	"synopsis" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "books_isbn_unique" UNIQUE("isbn")
);
--> statement-breakpoint
CREATE TABLE "copies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"code" text NOT NULL,
	"acquisition_date" date,
	"status" "copy_status" DEFAULT 'DISPONIVEL' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "copies_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "librarians" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_number" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"hire_date" date NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"totp_secret" text,
	"first_login" boolean DEFAULT true NOT NULL,
	"require_2fa" boolean DEFAULT true NOT NULL,
	"is_2fa_enabled" boolean DEFAULT false NOT NULL,
	"backup_codes" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "librarians_registration_number_unique" UNIQUE("registration_number"),
	CONSTRAINT "librarians_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"copy_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"librarian_id" uuid NOT NULL,
	"returned_by_librarian_id" uuid,
	"status" "loan_status" DEFAULT 'EMPRESTADO' NOT NULL,
	"loaned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"returned_at" timestamp with time zone,
	"block_until" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "loans_dates_check" CHECK (returned_at is null or returned_at >= loaned_at),
	CONSTRAINT "loans_due_date_check" CHECK (due_date >= loaned_at)
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_number" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"education_level" "education_level" NOT NULL,
	"grade" integer NOT NULL,
	"section" text NOT NULL,
	"enrollment_year" integer NOT NULL,
	"graduation_year" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "students_registration_number_unique" UNIQUE("registration_number"),
	CONSTRAINT "students_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "book_authors" ADD CONSTRAINT "book_authors_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_authors" ADD CONSTRAINT "book_authors_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copies" ADD CONSTRAINT "copies_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_copy_id_copies_id_fk" FOREIGN KEY ("copy_id") REFERENCES "public"."copies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_librarian_id_librarians_id_fk" FOREIGN KEY ("librarian_id") REFERENCES "public"."librarians"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_returned_by_librarian_id_librarians_id_fk" FOREIGN KEY ("returned_by_librarian_id") REFERENCES "public"."librarians"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "book_authors_author_id_idx" ON "book_authors" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "books_title_idx" ON "books" USING btree ("title");--> statement-breakpoint
CREATE INDEX "copies_book_id_idx" ON "copies" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "copies_status_idx" ON "copies" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "loans_active_copy_idx" ON "loans" USING btree ("copy_id") WHERE status = 'EMPRESTADO';--> statement-breakpoint
CREATE INDEX "loans_student_id_idx" ON "loans" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "loans_copy_id_idx" ON "loans" USING btree ("copy_id");--> statement-breakpoint
CREATE INDEX "loans_due_date_idx" ON "loans" USING btree ("due_date");