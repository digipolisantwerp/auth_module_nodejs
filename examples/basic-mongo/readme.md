#How to run this example

There are two options to run this example:
1. *run in docker:* `docker-compose up` should do the trick
2. *run locally:* `npm install` && `npm start`. This options requires that you have [mongodb](https://www.mongodb.com/) & node.js installed

In both cases the application will start on port 2000.
You have the option to override this in  `docker-compose.yml` or `config.js`

The example is only fully functional when you have configured this correctly in the api store
& added the `clientId` & `clientSecret` in the config.js file


You can see the example in action on following endpoint:

GET http://localhost:2000/auth/isloggedin
GET http://localhost:2000/auth/isloggedin/aprofiel
GET http://localhost:2000/auth/login/aprofiel
GET http://localhost:2000/auth/logout/aprofiel