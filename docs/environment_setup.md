# Setting up your environment

## Prerequisites

Before you begin, ensure you have the following installed:

- [Git](https://git-scm.com/)
- [Visual Studio Code](https://code.visualstudio.com/)

## Cloning the repository

[Clone the repository](https://github.com/git-guides/git-clone) into a local workspace. Avoid folders that have cloud sync services, such as Microsoft OneDrive.

## Starting your Project

Open the project in VS Code.\
Open a terminal at the project root and run `npm install` to install all required dependencies.\
Also, run the following command to set up the environment variables:
```
cp .env.example .env # duplicates the template and renames it to .env
```
Make sure to contact one of us for the environment variables.\
Next, run `npm run dev` and you should be able to navigate to http://localhost:3000 to view the running website.

## Stopping the Project

Close the running app with `Ctrl + C`.

## Conclusion

By the end of this, you should have an interactive app running on your browser.\
You are ready to start contributing.

Next: Read the Contributing Guidelines before you begin!
