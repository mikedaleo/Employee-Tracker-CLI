-- delete employees_db if it exists and then create a new employees_db
DROP DATABASE IF EXISTS employees_db;
CREATE DATABASE employees_db;

-- connect to the employees_db
\c employees_db;

-- create a department table 
CREATE TABLE department (
    id SERIAL PRIMARY KEY,
    name VARCHAR(30) UNIQUE NOT NULL
);

-- create a role table 
CREATE TABLE role (
    id SERIAL PRIMARY KEY,
    title VARCHAR(30) UNIQUE NOT NULL,
    salary DECIMAL NOT NULL,
    department_id INTEGER,
    FOREIGN KEY (department_id)
    REFERENCES department(id)
);

-- create an employee table
CREATE TABLE employee (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(30) NOT NULL,
    last_name VARCHAR(30) NOT NULL,
    role_id INTEGER,
    FOREIGN KEY (role_id) 
    REFERENCES role(id),
    manager_id INTEGER,
    FOREIGN KEY (manager_id)
    REFERENCES employee(id)
);

-- if a department is deleted, delete all roles within that department
ALTER TABLE role
DROP CONSTRAINT role_department_id_fkey,
ADD CONSTRAINT role_department_id_fkey
FOREIGN KEY (department_id)
REFERENCES department (id)
ON DELETE CASCADE;

-- if a role is deleted, delete all employees within that role
ALTER TABLE employee
DROP CONSTRAINT employee_role_id_fkey,
ADD CONSTRAINT employee_role_id_fkey
FOREIGN KEY (role_id)
REFERENCES role (id)
ON DELETE CASCADE;