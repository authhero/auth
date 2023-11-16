export default function generateOTP() {
  const digits = "1234567890";
  let otp = "";
  for (let i = 0; i < 6; i += 1) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp.toString();
}
