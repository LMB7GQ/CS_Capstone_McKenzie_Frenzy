// TODO: Implement User model schema

class User {
    #id;
    #username;
    #email;
    #passwordHash;
    #createdAt;
    #firstName;
    #lastName;

    constructor(id, username, email, passwordHash, createdAt, firstName, lastName) {
        this.#id = id;
        this.#username = username;
        this.#email = email;
        this.#passwordHash = passwordHash;
        this.#createdAt = createdAt;
        this.#firstName = firstName;
        this.#lastName = lastName;
    }

    //getters
    get id() {
        return this.#id;
    }

    get username() {
        return this.#username;
    }

    get email() {
        return this.#email;
    }

    get passwordHash() {
        return this.#passwordHash;
    }   

    get createdAt() {
        return this.#createdAt;
    }

    get firstName() {
        return this.#firstName;
    }

    get lastName() {
        return this.#lastName;
    }   

    //setters
    set id(newId) {
        this.#id = newId;
    }

    set username(newUsername) {
        this.#username = newUsername;
    }

    set email(newEmail) {
        this.#email = newEmail;
    }

    set passwordHash(newPasswordHash) {
        this.#passwordHash = newPasswordHash;
    }

    set createdAt(newCreatedAt) {
        this.#createdAt = newCreatedAt;
    }   

    set firstName(newFirstName) {
        this.#firstName = newFirstName;
    }   

    set lastName(newLastName) {
        this.#lastName = newLastName;
    }   

    
}