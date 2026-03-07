Because your application has highly structured relationships (a User has an Avatar, a User saves many Dresses, a Try-On Scene connects a User to a specific Dress via an AI Job), I highly recommend using a **relational database like PostgreSQL**.

If you use PostgreSQL alongside an ORM like Prisma (which works beautifully with Express.js and TypeScript), your data will be perfectly typed and incredibly fast.

Here is the complete database schema design.

---

### 1. `users` Table

The core table for authentication and user profiles.

* **`id`** (UUID, Primary Key)
* **`email`** (String, Unique)
* **`password_hash`** (String)
* **`name`** (String)
* **`created_at`** (Timestamp)

### 2. `avatars` Table

Stores the user's uploaded photos and the final generated 3D model. We separate this from the `users` table because a user might want to regenerate their avatar later.

* **`id`** (UUID, Primary Key)
* **`user_id`** (UUID, Foreign Key -> `users.id`)
* **`front_image_url`** (String) - *S3 bucket link*
* **`side_image_url`** (String) - *S3 bucket link*
* **`back_image_url`** (String) - *S3 bucket link*
* **`model_3d_url`** (String, Nullable) - *Starts as NULL. FastAPI fills this with the S3 `.glb` link when the job finishes.*
* **`created_at`** (Timestamp)

### 3. `ai_jobs` Table (The Most Critical Table)

This is the "Control Center" for your asynchronous architecture. When Express drops a ticket into Redis, it also creates a row here. Next.js will constantly poll this table to see if a job is done.

* **`id`** (String, Primary Key) - *e.g., "job_123abc"*
* **`user_id`** (UUID, Foreign Key -> `users.id`)
* **`job_type`** (Enum: `AVATAR_GENERATION` or `TRY_ON_SCENE`)
* **`status`** (Enum: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`) - *Next.js checks this column.*
* **`payload`** (JSONB) - *Stores what FastAPI needs (e.g., `{"dress_id": "890", "prompt": "beach sunset"}`)*
* **`result_url`** (String, Nullable) - *FastAPI saves the final S3 image/model link here when done.*
* **`error_message`** (String, Nullable) - *If the GPU crashes or the LLM fails, save the error here so the frontend can tell the user.*
* **`created_at`** (Timestamp)
* **`completed_at`** (Timestamp, Nullable)

### 4. `dresses` Table (The Scraped Catalog)

You don't want to re-scrape Google if two users search for the exact same dress. Once FastAPI scrapes a dress, it saves it here forever.

* **`id`** (UUID, Primary Key)
* **`source_url`** (String, Unique) - *The original store link. Making this Unique prevents duplicate dresses in your database.*
* **`image_url`** (String) - *The thumbnail image of the dress.*
* **`name`** (String)
* **`price`** (String)
* **`search_tags`** (JSONB / Array of Strings) - *e.g., `["floral", "summer", "maxi", "yellow"]`. You can use this to quickly query the database before scraping the web.*
* **`created_at`** (Timestamp)

### 5. `user_saved_dresses` Table (Favorites / Offline Sync)

A simple "Join Table" that connects a User to the Dresses they liked. **This is the exact table Express will query and send to Next.js to save in IndexedDB for your offline mode.**

* **`user_id`** (UUID, Foreign Key -> `users.id`)
* **`dress_id`** (UUID, Foreign Key -> `dresses.id`)
* **`saved_at`** (Timestamp)
* *(Primary Key is a composite of `user_id` + `dress_id` so a user can't save the same dress twice)*

### 6. `generated_scenes` Table (The User's Gallery)

When a `TRY_ON_SCENE` AI job successfully finishes, FastAPI inserts a record here so the user has a permanent gallery of all the outfits they've generated.

* **`id`** (UUID, Primary Key)
* **`user_id`** (UUID, Foreign Key -> `users.id`)
* **`dress_id`** (UUID, Foreign Key -> `dresses.id`)
* **`job_id`** (String, Foreign Key -> `ai_jobs.id`)
* **`scene_prompt`** (String) - *e.g., "standing by the ocean"*
* **`final_image_url`** (String) - *The S3 link to the image.*
* **`created_at`** (Timestamp)

---

### How the Data Flows (A Real Example)

Let's look at exactly how these tables work together when a user clicks **"Generate Try-On"**:

1. **Express** creates a new row in `ai_jobs`:
* `id`: "job_999"
* `status`: "PENDING"
* `job_type`: "TRY_ON_SCENE"


2. **Next.js** starts polling: `GET /api/try-on/status/job_999`. Express checks the database. Status is "PENDING".
3. **FastAPI (Celery Worker)** picks up the job, downloads the 3D model and the dress image, and runs the Stable Diffusion / VTON model on the GPU.
4. **FastAPI** finishes 45 seconds later. It uploads `result.jpg` to AWS S3.
5. **FastAPI** runs a SQL update command directly on your database:
* Updates `ai_jobs` where `id = 'job_999'` -> Sets `status` to `COMPLETED` and `result_url` to the S3 link.
* Inserts a new row into `generated_scenes` so it appears in the user's gallery.


6. **Next.js** polls one last time. Express checks the DB, sees `COMPLETED`, and sends the `result_url` to the frontend. The image appears on the screen!

### Next Steps for You

You now have the Architecture, the API Docs, and the Database Schema.

If you are ready to start coding, the absolute best place to start is building the Express.js server and setting up **Prisma** to create these exact database tables. Would you like a quick snippet of what this database schema looks like written in a `schema.prisma` file so you can literally copy, paste, and generate your database today?