module.exports = function (socket) {

    // Socket.io client setup
    socket.on('connect', () => {
        console.log('Connected');
        socket.emit('getActiveClass');
    });

    socket.on('setClass', (newClassId) => {
        console.log(`The user is currently in the class with id ${newClassId}`);
    });

    let classId = 1; // Class Id here
    let classCode = 'vmnt' // If you're not already in the classroom, you can join it by using the class code.
    socket.emit('joinClass', classId);
    socket.on('joinClass', (response) => {
        // If joining the class is successful, it will return true.
        if (response == true) {
            console.log('Successfully joined class')
            socket.emit('classUpdate')
        } else {
            // If not, try to join the classroom with the class code.
            socket.emit('joinRoom', classCode);
            console.log('Failed to join class: ' + response)
        }
    });

    socket.on('classUpdate', (classroomData) => {
        console.log(classroomData);
    });

    // True or false 
    socket.emit('pollResp', 'True')

    // Text response
    socket.emit('pollResp', '', 'Text response here')

    socket.on('connect_error', (error) => {
        /*
            "xhr poll error" is just the error it give when it can't connect,
            which is usually when the Formbar is not on or you are not on the same network.
        */
        if (error.message == 'xhr poll error') {
            console.log('no connection');
        } else {
            console.log(error.message);
        }

        setTimeout(() => {
            socket.connect();
        }, 5000);
    });

};