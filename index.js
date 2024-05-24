const inquirer = require('inquirer');
const { Pool } = require('pg');
const { consoleTable } = require('js-awe');
const figlet = require('figlet');


const pool = new Pool(
    {
        user: 'postgres',
        password: 'password',
        host: 'localhost',
        database: 'employees_db'
    },
    console.log('Connected to the employees_db database.')
)

pool.connect();

figlet("Employee", function (err, data) {
    if(err) {
        console.log("Something went wrong...");
        console.dir(err);
        return;
    }
    console.log(data);

    figlet("Manager", function (err, data) {
    if(err) {
        console.log("Something went wrong...");
        console.dir(err);
        return;
    }
    console.log(data);
});


const questions = () => {
    inquirer
        .prompt([
            {
                type: 'list',
                name: 'start',
                message: 'What would you like to do?',
                choices: ['View All Departments', 'View All Roles', 'View All Employees', 'Add Department', 'Add Role', 'Add Employee', 'Update Employee Role'],
            },
        ])
        .then((answers) => {
            if (answers.start === 'View All Departments') {
                pool.query(`SELECT * FROM department`, (err, { rows }) => {
                    if (err) {
                        console.error(err.message);
                        return;
                    }
                    consoleTable(rows);
                    questions();
                });
            } else if (answers.start === 'View All Roles') {
                pool.query(`SELECT role.id, title, department.name AS department, salary FROM role JOIN department ON role.department_id = department.id`, (err, { rows }) => {
                    consoleTable(rows);
                    questions();
                });
            } else if (answers.start === 'View All Employees') {
                pool.query(`SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager FROM employee JOIN role ON employee.role_id = role.id JOIN department
                ON department.id = role.department_id LEFT JOIN employee m ON employee.manager_id = m.id`, (err, { rows }) => {
                    consoleTable(rows);
                    questions();
                });
            } else if (answers.start === 'Add Department') {
                inquirer.prompt([
                    {
                        type: 'input',
                        name: 'department',
                        message: 'What is the name of the department?',
                    },
                ]) 
                .then((answers) => {
                    pool.query(`INSERT INTO department`)
                }) 
            
            } else if (answers.start === 'Add Role') {
                inquirer.prompt([
                    {
                        type: 'input',
                        name: 'role',
                        message: 'What is the name of the role?',
                    },
                    {
                        type: 'input',
                        name: 'roleSalary',
                        message: 'What is the salary of the role?',
                    },
                    {
                        type: 'list',
                        name: 'roleDepartment',
                        message: 'Which department does the role belong to?',
                        choices: [],
                    }
                ]);
            } else if (answers.start === 'Add Employee') {
                inquirer.prompt([
                    {
                        type: 'input',
                        name: 'firstName',
                        message: `What is the employee's first name?`,
                    },
                    {
                        type: 'input',
                        name: 'lastName',
                        message: `What is the employee's last name?`,
                    },
                    {
                        type: 'list',
                        name: 'employeeRole',
                        message: `What is the employee's role?`,
                        choices: [],
                    },
                    {
                        type: 'list',
                        name: 'employeeManager',
                        message: `Who is the employee's manager?`,
                        choices: [],
                    },

                ]);
            } else if (answers.start === 'Update Employee Role') {
                inquirer.prompt([
                    {
                        type: 'list',
                        name: 'employeeSelect',
                        message: `Which employee's role do you want to update?`,
                        choices: [],
                    }
                ]);
            };

        })

}


questions();
});