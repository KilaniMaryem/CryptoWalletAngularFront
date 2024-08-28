# AngularWalletApp

This chrome extension cryptowallet project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 15.2.5.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.
Then load the extension in Chrome:
   1. Go to chrome://extensions/
   2. Enable Developer Mode
   3. Click on "Load unpacked".
   4. Select the build output directory (dist/angular-wallet-app/).

## Backend Services Setup
To ensure that all necessary backend services are running for your Chrome extension, follow these steps:

1. Navigate to the "back" folder where the backend services are located.

2. Run the "start_services.bat" script: This script will locally start the Flask, MinIO, and NestJS servers needed for the application.

3. Ensure XAMPP is running:

NestJS requires a running SQL database, so make sure XAMPP is active and the necessary database services are running.

## Overview of Backend Services
1. Flask:
Handles the voice authentication part of the app. It relies on MinIO to store users' voice prints.

2. MinIO:
A storage solution used by the Flask server to securely save the voice prints of users.

3. NestJS:
Manages two-factor authentication (TFA) using QR codes and sends emails for suspicious activity detection.
Before launching the Chrome extension, ensure all these services are up and running to guarantee full functionality.