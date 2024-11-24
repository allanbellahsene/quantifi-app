# Backend

## Authentication

### Test

There are three differents things to test:

1. Registering & Login by username, email and password
2. Registering & Login by Gmail
3. Access protected routes if login

To test the authentication procedure, there are two ways.
First via the *curl* command and second via a *React App*.

1. To use it via the curl command, go to the *test* repository
```
cd test
./test_protected.sh
```
2. For the test via React App, go to *test/auth-app*
```
cd test/auth-app
npm start
```

## Migration

The migration of the database as to be made, every time a SQL model has been added or modified.

At the root of the backend project, use the following command:
'''
alembic revision --autogenerate -m "Migration message"
alembic upgrade head
'''

If something goes wrong you can rollback:
'''
alembic downgrade -1
'''