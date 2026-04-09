import { User } from "../types/models";

export const mockUsers: User[] = [
  { id: "u1", fullName: "נועה כהן", cityId: "jerusalem", equipmentIds: ["wheelchair", "walker"] },
  { id: "u2", fullName: "איתי לוי", cityId: "tel-aviv", equipmentIds: ["oxygen", "crutches"] },
  { id: "u3", fullName: "רוני אברהם", cityId: "haifa", equipmentIds: ["wheelchair"] },
  { id: "u4", fullName: "יעל מזרחי", cityId: "petah-tikva", equipmentIds: ["breast-pump", "walker"] },
  { id: "u5", fullName: "דניאל אוחנה", cityId: "beer-sheva", equipmentIds: ["hospital-bed", "oxygen"] },
  { id: "u6", fullName: "מיכל בן דוד", cityId: "ashdod", equipmentIds: ["crutches", "wheelchair"] }
];
