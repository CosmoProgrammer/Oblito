# Oblito

## Setup:

1. Install NodeJS v22.17.0 LTS. You can use a NodeJS version manager like `nvm` to do this:

    ```
    nvm install v22.17.0
    nvm use v22.17.0
    ```

2. Create the `.env` files. Use the `.env.example` files as a template.

3. Install dependencies:

    ```
    cd backend
    npm i

    cd frontend
    npm i
    ```

## Docker Build System:

This project uses [Docker Compose profiles](https://docs.docker.com/compose/how-tos/profiles/). Currently, there is one profile: `dev`.

Run `docker compose --profile PROFILE down` to stop and delete all containers in the specified profile.

> [!NOTE]
> Adding the `-v` flag only deletes the `node_modules` cache mount. To clear database data, you'll need to delete the `db/data` folder, which usually needs root permissions.

Run `docker compose --profile PROFILE up --build` to build and run all containers in the specified profile. Adding the `-d` flag runs the containers in the background.

The `dev` profile binds mount your source code into the containers and so supports hot reloading with Vite. **However, changes to the `package.json` and `package-lock.json` do require full container rebuilds.**

> [!NOTE]
> It is advised to run `npm i` locally and also delete the `node_modules` cache mount by running `docker compose --profile PROFILE down -v` in this case before rebuilding.

Obviously, changes to `.env` also require container restarts.

### Database Setup

1. Push the schema with `drizzle-kit`.

    ```powershell
    docker compose exec backend npm run db:push
    ```

2. You can check if it worked by running the following commands.

    ```powershell
    docker compose exec -it db psql -U oblito_user -d oblito_db
    \dt
    \d <table_name>
    \q
    ```


## Contributing

1. Create a new branch from `main` for every change. Use [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/), for example:

    ```powershell
    git checkout -b feat/<short-description>
    ```

2. Work locally, commit often with conventional commits

    ```powershell
    git add .
    git commit -m "feat:<short-description>"
    ```

3. Push your branch to the remote and open a Pull Request on GitHub:

    ```powershell
    git push origin feat/<short-description>
    # Then open a PR on GitHub from your branch into `main`.
    ```

4. Wait for code review from atleast one other person before merging.