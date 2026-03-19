const realLikeData = {
  schools: [
    {
      schoolId: "A001",
      name: "A학교",
      level: "중학교",
      students: 214,
      teachers: 24,
      classrooms: 11,
      scienceLabs: 1,
      computerLabs: 1,
      yearFounded: 1987,
      district: "생활권 A"
    },
    {
      schoolId: "B001",
      name: "B학교",
      level: "중학교",
      students: 356,
      teachers: 31,
      classrooms: 15,
      scienceLabs: 1,
      computerLabs: 1,
      yearFounded: 1996,
      district: "생활권 B"
    },
    {
      schoolId: "C001",
      name: "C학교",
      level: "중학교",
      students: 498,
      teachers: 38,
      classrooms: 19,
      scienceLabs: 2,
      computerLabs: 1,
      yearFounded: 2008,
      district: "생활권 C"
    },
    {
      schoolId: "D001",
      name: "D학교",
      level: "중학교",
      students: 612,
      teachers: 45,
      classrooms: 24,
      scienceLabs: 2,
      computerLabs: 2,
      yearFounded: 2013,
      district: "생활권 A"
    },
    {
      schoolId: "E001",
      name: "E학교",
      level: "중학교",
      students: 742,
      teachers: 53,
      classrooms: 28,
      scienceLabs: 2,
      computerLabs: 2,
      yearFounded: 2018,
      district: "생활권 D"
    },
    {
      schoolId: "F001",
      name: "F학교",
      level: "중학교",
      students: 884,
      teachers: 61,
      classrooms: 32,
      scienceLabs: 3,
      computerLabs: 2,
      yearFounded: 2021,
      district: "생활권 B"
    },
    {
      schoolId: "G001",
      name: "G학교",
      level: "중학교",
      students: 973,
      teachers: 68,
      classrooms: 36,
      scienceLabs: 3,
      computerLabs: 3,
      yearFounded: 2023,
      district: "생활권 C"
    }
  ],

  schoolCalendar: [
    { schoolId: "A001", eventDate: "2026-04-07", eventName: "과학 탐구 주간" },
    { schoolId: "A001", eventDate: "2026-05-12", eventName: "환경 프로젝트 발표" },
    { schoolId: "C001", eventDate: "2026-04-14", eventName: "지역 문제 탐구 수업" },
    { schoolId: "D001", eventDate: "2026-05-19", eventName: "데이터 분석 실습" },
    { schoolId: "F001", eventDate: "2026-06-02", eventName: "과학탐구실험 집중 주간" }
  ],

  educationStats: [
    { district: "생활권 A", year: 2022, middleStudents: 4210, schools: 8 },
    { district: "생활권 A", year: 2023, middleStudents: 4085, schools: 8 },
    { district: "생활권 A", year: 2024, middleStudents: 3952, schools: 8 },

    { district: "생활권 B", year: 2022, middleStudents: 5174, schools: 9 },
    { district: "생활권 B", year: 2023, middleStudents: 5068, schools: 9 },
    { district: "생활권 B", year: 2024, middleStudents: 4941, schools: 9 },

    { district: "생활권 C", year: 2022, middleStudents: 6038, schools: 10 },
    { district: "생활권 C", year: 2023, middleStudents: 6125, schools: 10 },
    { district: "생활권 C", year: 2024, middleStudents: 6214, schools: 10 },

    { district: "생활권 D", year: 2022, middleStudents: 3382, schools: 6 },
    { district: "생활권 D", year: 2023, middleStudents: 3317, schools: 6 },
    { district: "생활권 D", year: 2024, middleStudents: 3256, schools: 6 }
  ],

  airQuality: [
    { district: "생활권 A", month: "3월", pm25: 41, pm10: 58 },
    { district: "생활권 A", month: "4월", pm25: 32, pm10: 49 },
    { district: "생활권 A", month: "5월", pm25: 27, pm10: 39 },

    { district: "생활권 B", month: "3월", pm25: 46, pm10: 61 },
    { district: "생활권 B", month: "4월", pm25: 35, pm10: 52 },
    { district: "생활권 B", month: "5월", pm25: 29, pm10: 41 },

    { district: "생활권 C", month: "3월", pm25: 38, pm10: 55 },
    { district: "생활권 C", month: "4월", pm25: 30, pm10: 47 },
    { district: "생활권 C", month: "5월", pm25: 25, pm10: 36 },

    { district: "생활권 D", month: "3월", pm25: 49, pm10: 64 },
    { district: "생활권 D", month: "4월", pm25: 37, pm10: 54 },
    { district: "생활권 D", month: "5월", pm25: 31, pm10: 43 }
  ]
};

const subjectOptions = {
  "중학교": ["1학년 과학", "2학년 과학", "3학년 과학"],
  "고등학교": ["통합과학", "과학탐구실험", "통합사회"]
};

const datasetLabels = {
  school: "우리 학교·주변 학교 현황",
  trend: "생활권 학생 수 변화",
  env: "생활권 환경 데이터",
  calendar: "학사일정 예시"
};