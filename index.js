const figlet = require('figlet');
const { questions } = require('./questions');

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

    questions();
});
