export interface IUser extends Document {
    name: string;
    email: string;
    image: string;
    role: "user" | "creator" | "admin" | "guide";
    password?: string;
    confirmpassword?: string;
    passwordChangedAt?: Date;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    active: boolean;
}
