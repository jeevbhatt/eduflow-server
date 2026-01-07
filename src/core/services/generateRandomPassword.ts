import bcrypt from "bcrypt";

const generateRandomPassword = (name: string) => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const plainVersion = `${name.replace(/\s+/g, "").toLowerCase()}${randomNum}`;
  const hashedPassword = bcrypt.hashSync(plainVersion, 10);

  return {
    plainVersion,
    hashedPassword,
  };
};

export default generateRandomPassword;
