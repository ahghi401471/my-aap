import { User } from "../types/models";

export const mockUsers: User[] = [
  {
    id: "u1",
    fullName: "נועה כהן",
    phoneNumber: "050-1234567",
    cityId: "d799d7a8d795d7a9d79cd799d79d",
    address: {
      cityId: "d799d7a8d795d7a9d79cd799d79d",
      streetName: "שדרות רוטשילד",
      houseNumber: "12",
      lat: 32.0642,
      lng: 34.7753
    },
    equipmentIds: ["novorapid", "libre3", "omnipod5", "verioreflect", "verioStrips"]
  },
  {
    id: "u2",
    fullName: "איתי לוי",
    phoneNumber: "052-2345678",
    cityId: "d7aad79c20d790d791d799d791202dd799d7a4d795",
    address: {
      cityId: "d7aad79c20d790d791d799d791202dd799d7a4d795",
      streetName: "דרך מנחם בגין",
      houseNumber: "144",
      lat: 32.0727,
      lng: 34.7926
    },
    equipmentIds: ["lantus", "dexcomg7", "tslimx2", "autosoft90", "contournextone", "contourNextStrips"],
    temporaryLocation: {
      cityId: "d799d7a8d795d7a9d79cd799d79d",
      durationHours: 8,
      expiresAt: "2099-12-31T23:59:59.000Z"
    }
  },
  {
    id: "u3",
    fullName: "רוני אברהם",
    phoneNumber: "053-3456789",
    cityId: "d797d799d7a4d794",
    address: {
      cityId: "d797d799d7a4d794",
      streetName: "הנשיא",
      houseNumber: "83",
      lat: 32.8048,
      lng: 34.9896
    },
    equipmentIds: ["humalog", "minimed780g", "mioadvance", "accuchekguide", "guideStrips"]
  },
  {
    id: "u4",
    fullName: "יעל מזרחי",
    phoneNumber: "054-4567890",
    cityId: "d7a4d7aad79720d7aad7a7d795d795d794",
    address: {
      cityId: "d7a4d7aad79720d7aad7a7d795d795d794",
      streetName: "ויצמן",
      houseNumber: "34",
      lat: 32.0871,
      lng: 34.8876
    },
    equipmentIds: ["fiasp", "freedomlite", "freestyleLiteStrips", "delicaPlusLancets"]
  },
  {
    id: "u5",
    fullName: "דניאל אוחנה",
    phoneNumber: "055-5678901",
    cityId: "d791d790d7a820d7a9d791d7a2",
    address: {
      cityId: "d791d790d7a820d7a9d791d7a2",
      streetName: "הרצל",
      houseNumber: "18",
      lat: 31.2522,
      lng: 34.7915
    },
    equipmentIds: ["tresiba", "guardian4", "minimed770g", "quickset", "accuchekinstant", "instantStrips"],
    temporaryLocation: {
      cityId: "d790d7a9d793d795d793",
      durationHours: 24,
      expiresAt: "2099-12-31T23:59:59.000Z"
    }
  },
  {
    id: "u6",
    fullName: "מיכל בן דוד",
    phoneNumber: "058-6789012",
    cityId: "d790d7a9d793d795d793",
    address: {
      cityId: "d790d7a9d793d795d793",
      streetName: "רוטשילד",
      houseNumber: "5",
      lat: 31.7684,
      lng: 35.2134
    },
    equipmentIds: ["apidra", "toujeo", "danai", "orbitmicro", "ultra2", "ultraStrips", "softclixLancets"]
  }
];
