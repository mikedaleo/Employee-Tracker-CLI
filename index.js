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
    if (err) {
        console.log("Something went wrong...");
        console.dir(err);
        return;
    }
    console.log(data);

    figlet("Manager", function (err, data) {
        if (err) {
            console.log("Something went wrong...");
            console.dir(err);
            return;
        }
        console.log(data);
    });


    const getDepartmentNames = () => {
        return new Promise((resolve, reject) => {
            pool.query('SELECT * FROM department', (err, { rows }) => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                }

                resolve(rows);
            });
        });
    };

    const getRoles = () => {
        return new Promise((resolve, reject) => {
            pool.query('SELECT * FROM role FULL OUTER JOIN employee ON role.id = employee.role_id', (err, { rows }) => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                }
                console.log(rows)
                resolve(rows);
            });
        });
    };

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
                            console.log(answers);
                            const queryText = 'INSERT INTO department(name) VALUES($1)';
                            pool.query(queryText, [answers.department], (err) => {
                                if (err) {
                                    console.log('Error adding department:', err);
                                } else {
                                    console.log('Department added successfully.');
                                }
                                questions();
                            });
                        });


                } else if (answers.start === 'Add Role') {
                    getDepartmentNames()

                        .then((departmentNames) => {
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
                                    choices: departmentNames.map(department => ({ name: department.name, value: department.id })),
                                }
                            ])
                                .then((answers) => {
                                    console.log(answers);
                                    const queryText = 'INSERT INTO role(title, salary, department_id) VALUES($1, $2, $3)';
                                    pool.query(queryText, [answers.role, answers.roleSalary, answers.roleDepartment], (err) => {
                                        if (err) {
                                            console.log('Error adding role:', err);
                                        } else {
                                            console.log('Role added successfully.');
                                        }
                                        questions();
                                    });
                                });
                        })
                        .catch((error) => {
                            console.error('Error getting department names:', error);
                        });

                } else if (answers.start === 'Add Employee') {
                    getRoles()
                        .then((data) => {
                            const uniqueRoles = data.reduce((unique, role) => {
                                
                                if (!unique.some(obj => obj.value === role.id)) {
                                    unique.push({ name: role.title, value: role.id });
                                }
                                return unique;
                            }, []);
                            const managers = data.filter(employee => employee.role_id === 6);
                            
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
                                    choices: uniqueRoles,
                                },
                                {
                                    type: 'list',
                                    name: 'employeeManager',
                                    message: `Who is the employee's manager?`,
                                    choices: managers.map(manager => ({ name: `${manager.first_name} ${manager.last_name}`, value: manager.id })),
                                },
                            ])
                                .then((answers) => {
                                    console.log(answers);
                                    const queryText = 'INSERT INTO employee(first_name, last_name, role_id, manager_id) VALUES($1, $2, $3, $4)';
                                    pool.query(queryText, [answers.firstName, answers.lastName, answers.employeeRole, answers.employeeManager], (err) => {
                                        if (err) {
                                            console.log('Error adding role:', err);
                                        } else {
                                            console.log('Employee added successfully.');
                                        }
                                        questions();
                                    });
                                });
                        })
                        .catch((error) => {
                            console.error('Error adding employee:', error);
                        });

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