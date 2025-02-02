# Setting Up Your Supabase Backend

LLM-Play is designed to work with a Supabase backend. Whether you prefer a hosted Supabase instance or running Supabase locally, the instructions below will help you get started quickly. Our open source codebase includes migration files and configuration templates so that anyone can easily set up their own backend.

## Option 1: Using a Hosted Supabase Instance

1. **Create a New Supabase Project:**
   - Visit [database.new](https://database.new) or [Supabase](https://supabase.com) and create a new project.
   - Once your project is running, head to the **Table Editor** to create your database schema.  
     _For example, you can create a table by running the following SQL in the SQL Editor:_

   ```sql
   -- Create a sample table called "instruments"
   create table instruments (
     id bigint primary key generated always as identity,
     name text not null
   );

   -- Insert some sample data
   insert into instruments (name)
   values
     ('violin'),
     ('viola'),
     ('cello');

   -- Enable row level security
   alter table instruments enable row level security;

   -- Create a policy to allow public read access
   create policy "public can read instruments"
   on public.instruments
   for select to anon
   using (true);
   ```

2. **Set Up Environment Variables:**
   - Rename the file `.env.example` (or create a new `.env.local`) in the root of your project.
   - Add your Supabase connection details:
     ```dotenv
     NEXT_PUBLIC_SUPABASE_URL=https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
     ```
   - You can find these values in your Supabase project settings under **API**.

3. **Run Your App:**
   - Start your development server with:
     ```bash
     npm run dev
     ```
   - Your application will connect to your hosted Supabase backend and you can begin exploring, testing, and contributing!

## Option 2: Running Supabase Locally

Local development with Supabase allows you to work in a self-contained environment. This can be faster, offline-friendly, and cost-effective.

1. **Install the Supabase CLI:**
   - Install it locally as a dev dependency (or globally if preferred):
     ```bash
     npm install supabase --save-dev
     ```
   - Alternatively, install globally with:
     ```bash
     npm install -g supabase
     ```

2. **Initialize the Supabase Project:**
   - In the root of your LLM-Play repository, run:
     ```bash
     npx supabase init
     ```
   - This command creates a `supabase` folder with configuration files and migration templates.

3. **Start the Local Supabase Stack:**
   - Run:
     ```bash
     npx supabase start
     ```
   - Your local Supabase instance will start (typically on `http://localhost:54323` for the dashboard and on another port for the API). Refer to the CLI output for exact details.

4. **Update Your Environment Variables:**
   - In your `.env.local`, update the Supabase variables to use your local instance’s details:
     ```dotenv
     NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321  # or the URL provided by the CLI
     NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR_LOCAL_SUPABASE_ANON_KEY>
     ```
   - The local anon key is provided when you run `npx supabase start`.

5. **Run Your App:**
   - Start your development server:
     ```bash
     npm run dev
     ```
   - Your application will now interact with your local Supabase backend.

## Additional Tips

- **Migration Files:**  
  The repository includes all necessary migration files. Use the Supabase CLI commands to manage and run migrations against your database.
- **Documentation & CLI Commands:**  
  For more detailed guidance, see the [Supabase Local Development docs](https://supabase.com/docs/guides/local-development) and the [Next.js quickstart guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs).

By following these instructions, you’ll have a fully functional Supabase backend for LLM-Play—whether hosted or local. This flexibility empowers you to run your own instance and customize the platform to your needs.