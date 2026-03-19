const START_YEAR = 2016;
const END_YEAR = 2025;

const DISTRICTS = ["생활권 A", "생활권 B"];

// 화면에서 선택 가능하게 할 학교만 지정
const selectableSchoolIds = [
  "A001",
  "A002",
  "B001",
  "B002"
];
// 학교 이름 라벨
const schoolNameMap = {
  A001: "A학교",
  A002: "B학교",
  B001: "C학교",
  B002: "D학교",
};

// 숫자 보정 함수
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// 간단한 의사난수(항상 같은 데이터가 나오게)
function seededValue(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// 학교 20개 생성: 생활권 A 10개, 생활권 B 10개
function generateSchools() {
  const schools = [];

  DISTRICTS.forEach((district, districtIndex) => {
    for (let i = 1; i <= 10; i++) {
      const prefix = districtIndex === 0 ? "A" : "B";
      const schoolId = `${prefix}${String(i).padStart(3, "0")}`;

      schools.push({
        schoolId,
        name: schoolNameMap[schoolId] || `${prefix}권역 ${i}학교`,
        level: "중학교",
        district,
        students: 250 + districtIndex * 80 + i * 37,
        teachers: 22 + i * 2 + districtIndex * 3,
        classrooms: 10 + i,
        scienceLabs: i >= 6 ? 2 : 1,
        computerLabs: i >= 8 ? 2 : 1,
        yearFounded: 1985 + districtIndex * 6 + i * 2,
      });
    }
  });

  return schools;
}

const schools = generateSchools();

// 학교별 연도별 기본 통계 생성 (10년치)
function generateSchoolYearStats(schools) {
  const results = [];

  schools.forEach((school, schoolIndex) => {
    const baseStudents = school.students;
    const baseTeachers = school.teachers;
    const baseClassrooms = school.classrooms;

    for (let year = START_YEAR; year <= END_YEAR; year++) {
      const t = year - START_YEAR;
      const fluctuation = Math.round((seededValue((schoolIndex + 1) * 100 + year) - 0.5) * 30);

      const students = clamp(baseStudents + t * 6 - (schoolIndex % 3) * 4 + fluctuation, 120, 1200);
      const teachers = clamp(baseTeachers + Math.round(t * 0.5) + Math.round(fluctuation / 15), 15, 90);
      const classrooms = clamp(baseClassrooms + Math.floor(t / 3), 8, 45);
      const attendanceRate = clamp(94 + (seededValue(year + schoolIndex) * 4), 90, 99.5);
      const scienceAchievement = clamp(58 + t * 1.4 + schoolIndex * 0.6 + fluctuation / 10, 45, 96);
      const studentSatisfaction = clamp(68 + t * 1.1 + (schoolIndex % 5) * 1.3, 55, 96);

      results.push({
        schoolId: school.schoolId,
        district: school.district,
        year,
        students: Math.round(students),
        teachers: Math.round(teachers),
        classrooms: Math.round(classrooms),
        scienceLabs: school.scienceLabs,
        computerLabs: school.computerLabs,
        attendanceRate: Number(attendanceRate.toFixed(1)),
        scienceAchievement: Number(scienceAchievement.toFixed(1)),
        studentSatisfaction: Number(studentSatisfaction.toFixed(1)),
      });
    }
  });

  return results;
}

const schoolYearStats = generateSchoolYearStats(schools);

// 생활권별 연도별 교육 통계
function generateEducationStats() {
  const results = [];

  DISTRICTS.forEach((district, districtIndex) => {
    for (let year = START_YEAR; year <= END_YEAR; year++) {
      const t = year - START_YEAR;
      const base = districtIndex === 0 ? 5400 : 6100;
      const movement = districtIndex === 0 ? -85 * t : -40 * t;
      const fluctuation = Math.round((seededValue(year * (districtIndex + 3)) - 0.5) * 120);

      results.push({
        district,
        year,
        middleStudents: base + movement + fluctuation,
        schools: 10,
      });
    }
  });

  return results;
}

const educationStats = generateEducationStats();

// 생활권별 월별 환경 데이터 (10년 × 12개월 × 2지역)
function generateAirQuality() {
  const results = [];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  DISTRICTS.forEach((district, districtIndex) => {
    for (let year = START_YEAR; year <= END_YEAR; year++) {
      months.forEach((month) => {
        const seasonalPm25 =
          month <= 3 ? 42 :
          month <= 5 ? 29 :
          month <= 8 ? 19 :
          month <= 10 ? 24 : 36;

        const seasonalPm10 =
          month <= 3 ? 63 :
          month <= 5 ? 45 :
          month <= 8 ? 30 :
          month <= 10 ? 39 : 55;

        const districtBias = districtIndex === 0 ? -2 : 3;
        const yearTrend = -(year - START_YEAR) * 0.7;
        const noise = (seededValue(year * 100 + month * 10 + districtIndex) - 0.5) * 6;

        const pm25 = clamp(seasonalPm25 + districtBias + yearTrend + noise, 10, 80);
        const pm10 = clamp(seasonalPm10 + districtBias + yearTrend + noise * 1.2, 18, 120);

        const avgTempBase =
          month === 1 ? -1 :
          month === 2 ? 1 :
          month === 3 ? 7 :
          month === 4 ? 13 :
          month === 5 ? 18 :
          month === 6 ? 22 :
          month === 7 ? 26 :
          month === 8 ? 27 :
          month === 9 ? 22 :
          month === 10 ? 16 :
          month === 11 ? 9 : 2;

        const avgTemp = avgTempBase + districtIndex * 0.4 + (seededValue(month * year) - 0.5) * 1.6;
        const rainfall =
          month >= 6 && month <= 8
            ? 140 + Math.round(seededValue(year + month) * 120)
            : 20 + Math.round(seededValue(year * month) * 60);

        results.push({
          district,
          year,
          month,
          pm25: Number(pm25.toFixed(1)),
          pm10: Number(pm10.toFixed(1)),
          avgTemp: Number(avgTemp.toFixed(1)),
          rainfall,
        });
      });
    }
  });

  return results;
}

const airQuality = generateAirQuality();

// 학교별 월별 탐구용 데이터 (10년치)
function generateSchoolEnvironment(schools) {
  const results = [];

  schools.forEach((school, schoolIndex) => {
    for (let year = START_YEAR; year <= END_YEAR; year++) {
      for (let month = 1; month <= 12; month++) {
        const seasonalDust =
          month <= 3 ? 44 :
          month <= 5 ? 30 :
          month <= 8 ? 20 :
          month <= 10 ? 26 : 38;

        const schoolBias = (schoolIndex % 5) - 2;
        const yearTrend = -(year - START_YEAR) * 0.5;
        const noise = (seededValue(schoolIndex * 1000 + year * 10 + month) - 0.5) * 5;

        const pm25 = clamp(seasonalDust + schoolBias + yearTrend + noise, 10, 75);
        const indoorCo2 = clamp(520 + (schoolIndex % 6) * 60 + month * 8 + noise * 15, 400, 1500);
        const classroomTemp = clamp(
          (month <= 2 ? 19 : month <= 5 ? 22 : month <= 8 ? 27 : month <= 10 ? 23 : 20) +
            (schoolIndex % 3) * 0.5 +
            noise * 0.3,
          16,
          31
        );
        const absenteeismRate = clamp(
          1.8 + (month === 12 || month <= 2 ? 1.2 : 0) + (schoolIndex % 4) * 0.2 + seededValue(year + month + schoolIndex),
          0.5,
          6.0
        );

        results.push({
          schoolId: school.schoolId,
          district: school.district,
          year,
          month,
          pm25: Number(pm25.toFixed(1)),
          indoorCo2: Number(indoorCo2.toFixed(0)),
          classroomTemp: Number(classroomTemp.toFixed(1)),
          absenteeismRate: Number(absenteeismRate.toFixed(1)),
        });
      }
    }
  });

  return results;
}

const schoolEnvironment = generateSchoolEnvironment(schools);

// 학교별 태양광 설치·발전량 데이터
function generateSolarStats(schools) {
  const results = [];

  schools.forEach((school, schoolIndex) => {
    const hasSolar = schoolIndex % 4 !== 1; // 일부 학교만 미설치
    const capacityKw = hasSolar
      ? 25 + (schoolIndex % 5) * 10 + Math.round(seededValue(schoolIndex + 50) * 8)
      : 0;

    const generationKwh = hasSolar
      ? Math.round(
          capacityKw * (950 + (schoolIndex % 3) * 70 + seededValue(schoolIndex * 13) * 120)
        )
      : 0;

    results.push({
      schoolId: school.schoolId,
      schoolName: school.name,
      district: school.district,
      hasSolar,
      capacityKw,
      generationKwh,
    });
  });

  return results;
}

const solarStats = generateSolarStats(schools);

const realLikeData = {
  schools,
  selectableSchoolIds,
  schoolYearStats,
  schoolEnvironment,
  solarStats,
  educationStats,
  airQuality,
};

const subjectOptions = {
  중학교: ["1학년 과학", "2학년 과학", "3학년 과학"],
  고등학교: ["통합과학1", "통합과학2", "과학탐구실험1", "과학탐구실험2"],
};

const datasetLabels = {
  school: "우리 학교·주변 학교 현황",
  trend: "생활권 학생 수 변화(10년)",
  env: "생활권 환경 데이터(10년)",
  schoolEnv: "학교별 환경 데이터(10년)",
  solar: "태양광 설치·발전량 데이터",
};

let curriculumData = null;

export async function loadCurriculumData() {
  const response = await fetch("./science_curriculum_2022_checkbox.json");
  if (!response.ok) {
    throw new Error("교육과정 JSON을 불러오지 못했습니다.");
  }

  curriculumData = await response.json();
  return curriculumData;
}

export function getCurriculumData() {
  return curriculumData;
}

export function getSchoolLevels() {
  if (!curriculumData) return [];
  return [...new Set(curriculumData.courses.map((c) => c.school_level))];
}

export function getCoursesBySchoolLevel(schoolLevel = "") {
  if (!curriculumData) return [];

  let courses = curriculumData.courses;
  if (schoolLevel) {
    courses = courses.filter((c) => c.school_level === schoolLevel);
  }

  return [...new Set(courses.map((c) => c.course))];
}

export function getFilteredCourses({ schoolLevel = "", course = "" } = {}) {
  if (!curriculumData) return [];

  let filtered = curriculumData.courses;

  if (schoolLevel) {
    filtered = filtered.filter((c) => c.school_level === schoolLevel);
  }

  if (course) {
    filtered = filtered.filter((c) => c.course === course);
  }

  return filtered;
}

export function getSelectedStandards() {
  const checked = document.querySelectorAll(".standard-checkbox:checked");

  return Array.from(checked).map((el) => ({
    school_level: el.dataset.schoolLevel,
    course: el.dataset.course,
    unit: el.dataset.unit,
    achievement_code: el.dataset.code,
    achievement_text: el.dataset.text,
    display_text: el.dataset.display,
  }));
}

export function buildStandardsPrompt() {
  const selected = getSelectedStandards();

  if (selected.length === 0) return "";

  const lines = selected.map(
    (std) => `- ${std.achievement_code}: ${std.achievement_text}`
  );

  return [
    "다음 성취기준을 반드시 반영하여 작성하라.",
    "",
    "[성취기준]",
    ...lines,
  ].join("\n");
}

export function getSelectableSchools() {
  return realLikeData.schools.filter((school) =>
    realLikeData.selectableSchoolIds.includes(school.schoolId)
  );
}

export { realLikeData, subjectOptions, datasetLabels };