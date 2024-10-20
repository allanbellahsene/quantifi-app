# Backend

## Authentication

### Test

To test the authentication procedure, there are two ways.
First via the *curl* command and second via a *React App*.

1. To use it via the curl command, go to the *test* repository
```
cd test
./test_protected.sh
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