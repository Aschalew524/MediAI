export type ConsultationType = "video" | "written";

export type DoctorExperienceItem = {
  title: string;
  subtitle: string;
};

export type TopDoctor = {
  id: string;
  name: string;
  role: string;
  specialty: string;
  subSpecialty: string;
  yearsOfExperience: number;
  diseases: string[];
  consultationFees: {
    video: number;
    written: number;
  };
  heroImageUrl: string;
  education: {
    degree: string;
    year: string;
  };
  biography: string[];
  experience: DoctorExperienceItem[];
  affiliations: DoctorExperienceItem[];
  publicationsSummary: string;
};

export const doctorSpecialties = [
  "Oncology",
  "Cardiology",
  "Neurology",
  "Internal Medicine",
] as const;

const drAshenafiProfileBase: Omit<TopDoctor, "id"> = {
  name: "Dr. Ashenafi",
  role: "Oncologist",
  specialty: "Oncology",
  subSpecialty: "Medical Oncology, Hematologic Oncology",
  yearsOfExperience: 24,
  diseases: [
    "Skin Cancers",
    "Thyroid Disorders",
    "Breast Cancer",
    "Lung Cancer",
    "Head and Neck Cancer",
    "Lymphoma",
    "Myeloma",
    "Leukemia",
  ],
  consultationFees: {
    video: 490,
    written: 490,
  },
  heroImageUrl: "/doctor-portrait.svg",
  education: {
    degree: "MD: University of Zurich",
    year: "2001",
  },
  biography: [
    "Dr. Ashenafi is an experienced medical professional with a specialization in tumors of the upper respiratory tract, skin tumors, modern immunotherapies, and hematology. Broad cancer and rare tumors complete his knowledge.",
    "Currently, Dr. Ashenafi is the Chief Physician at the Swiss Cancer Services AG/Seeland Cancer Center in Hirslanden Klinik Linde, Biel, Switzerland. Previously, he worked as the Head of the Interdisciplinary Cancerology Service at Riviera-Chablais Hospital, where he served from 2019 to 2020.",
    "Dr. Ashenafi has held various leadership positions in his career. From 2009 to 2018, he was the Disease Leader for Head and Neck Cancer and Thyroid Cancer. Additionally, he was the Disease Leader for Skin Cancers and Melanoma from 2012 to 2018.",
    "Dr. Ashenafi is a member of numerous national and international scientific societies and associations. He is a founding member and board member of the Swiss Head and Neck Society and the President of the Head and Neck Cancer Working Group.",
  ],
  experience: [
    {
      title: "Head of the Interdisciplinary Cancerology Service, Riviera-Chablais Hospital",
      subtitle: "Rennaz, Switzerland. 2019 - 2020",
    },
    {
      title: "Head of the Interdisciplinary Cancerology Service, Riviera-Chablais Hospital",
      subtitle: "Rennaz, Switzerland. 2019 - 2020",
    },
    {
      title: "Head of the Interdisciplinary Cancerology Service, Riviera-Chablais Hospital",
      subtitle: "Rennaz, Switzerland. 2019 - 2020",
    },
    {
      title: "Head of the Interdisciplinary Cancerology Service, Riviera-Chablais Hospital",
      subtitle: "Rennaz, Switzerland. 2019 - 2020",
    },
    {
      title: "Head of the Interdisciplinary Cancerology Service, Riviera-Chablais Hospital",
      subtitle: "Rennaz, Switzerland. 2019 - 2020",
    },
  ],
  affiliations: [
    {
      title: "President of the Head and Neck Cancer Working Group",
      subtitle: "Since 2016",
    },
    {
      title: "President of the Head and Neck Cancer Working Group",
      subtitle: "Since 2016",
    },
    {
      title: "President of the Head and Neck Cancer Working Group",
      subtitle: "Since 2016",
    },
    {
      title: "President of the Head and Neck Cancer Working Group",
      subtitle: "Since 2016",
    },
  ],
  publicationsSummary: "Dr. Ashenafi has more than 40 publications",
};

export const topDoctors: TopDoctor[] = [
  {
    ...drAshenafiProfileBase,
    id: "dr-ashenafi-1",
  },
  {
    ...drAshenafiProfileBase,
    id: "dr-ashenafi-2",
  },
  {
    ...drAshenafiProfileBase,
    id: "dr-ashenafi-3",
  },
];

export function getTopDoctorById(doctorId: string) {
  return topDoctors.find((doctor) => doctor.id === doctorId) ?? topDoctors[0];
}
