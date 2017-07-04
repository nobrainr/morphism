export class User {
    constructor(firstName, lastName, phoneNumber){
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;

        this.type = 'User'; // Use to test default value scenario
    }
}

export class Track {
    constructor(id, title){
        this.id = id;
        this.title = title;
    }
}
