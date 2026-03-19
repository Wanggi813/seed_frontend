import {
  realLikeData,
  subjectOptions,
  datasetLabels,
  getSelectableSchools
} from "./data.js";

const appState = {
  lastImprovedPrompt: "",
  schoolLevel: "중학교",
  subject: "1학년 과학",
  classType: "2차시",
  equipment: "제한적임",
  goal: "지역문제 해결 중심",
  level: "표준형",
  selectedIssue: "dust",
  selectedDataset: "school",
  mySchoolId: "A001",
  aiLessonPlan: null,
  aiOutputs: null,
  fastMode: true,
  loadingTimer: null,
  selectedStandards: [],
  curriculumData: null,
};





function getMySchool() {
  return realLikeData.schools.find((school) => school.schoolId === appState.mySchoolId);
}

function getNeighborSchools() {
  const mySchool = getMySchool();
  if (!mySchool) return [];
  return realLikeData.schools.filter((school) => school.district === mySchool.district);
}

function populateSubjectSelect() {
  const select = document.getElementById("subject");
  const options = subjectOptions[appState.schoolLevel] || [];
  select.innerHTML = "";
  options.forEach((subject, index) => {
    const option = document.createElement("option");
    option.value = subject;
    option.textContent = subject;
    if (index === 0) option.selected = true;
    select.appendChild(option);
  });
  appState.subject = options[0] || "";
}

function populateSchoolSelect() {
  const select = document.getElementById("my-school");
  if (!select) return;

  const selectableSchools = getSelectableSchools();

  select.innerHTML = selectableSchools
    .map(
      (school) =>
        `<option value="${school.schoolId}">${school.name} (${school.district})</option>`
    )
    .join("");

  if (!selectableSchools.find((s) => s.schoolId === appState.mySchoolId)) {
    appState.mySchoolId = selectableSchools[0]?.schoolId || "";
  }

  select.value = appState.mySchoolId;
}

function getRecommendedDatasetsByStandards() {
  const selected = refreshSelectedStandards();
  const text = selected.map(s => `${s.achievement_text} ${s.display_text}`).join(" ");

  if (text.includes("환경") || text.includes("대기")) {
    return ["env", "schoolEnv", "school"];
  }
  if (text.includes("에너지")) {
    return ["solar", "school", "trend"];
  }
  return ["school", "trend", "env", "solar"];
}

function renderDatasetTabs() {
  const wrap = document.getElementById("dataset-tabs");
  wrap.innerHTML = "";

  const keys = getRecommendedDatasetsByStandards();

  keys.forEach((key) => {
    const btn = document.createElement("button");
    btn.className = `dataset-tab ${appState.selectedDataset === key ? "active" : ""}`;
    btn.textContent = datasetLabels[key];
    btn.dataset.dataset = key;
    btn.addEventListener("click", () => {
      appState.selectedDataset = key;
      renderDatasetTabs();
      renderIssueData();
    });
    wrap.appendChild(btn);
  });
}

function updateStateFromForm() {
  appState.schoolLevel = document.getElementById("school-level").value;
  appState.subject = document.getElementById("subject").value;
  appState.mySchoolId = document.getElementById("my-school").value;
  appState.classType = document.getElementById("class-type").value;
  appState.equipment = document.getElementById("equipment").value;
  appState.goal = document.getElementById("goal").value;
  appState.level = document.getElementById("level").value;
  appState.fastMode = document.getElementById("fast-mode")?.checked ?? true;
}

function renderSummary(targetId) {
  const target = document.getElementById(targetId);
  const mySchool = getMySchool();

  target.innerHTML = `
    <strong>선택한 조건</strong><br>
    학교급: ${appState.schoolLevel} · 과목: ${appState.subject} · 수업 형태: ${appState.classType}<br>
    기자재 환경: ${appState.equipment} · 수업 목표: ${appState.goal} · 학생 참여 수준: ${appState.level}<br>
    우리 학교: ${mySchool ? `${mySchool.name} (${mySchool.district})` : "-"} · 생성 모드: ${appState.fastMode ? "빠르게" : "정교하게"}
  `;
}

function getDatasetChartTitle() {
  const mySchool = getMySchool();
  const schoolName = mySchool ? mySchool.name : "우리 학교";
  const district = mySchool ? mySchool.district : "생활권";

  const titles = {
    school: `${schoolName}와 주변 학교 현황 비교`,
    trend: `${district} 학생 수 변화 추이`,
    env: `${district} 월별 PM2.5 변화`,
    schoolEnv: `${schoolName}와 주변 학교의 학교별 환경 비교`,
    solar: `${schoolName} 및 주변 학교 태양광 설치·발전량 비교`
  };
  return titles[appState.selectedDataset];
}

function getDatasetInsight() {
  const mySchool = getMySchool();
  const district = mySchool ? mySchool.district : "생활권";

  if (appState.selectedDataset === "school") {
    const neighbors = getNeighborSchools();
    const maxSchool = [...neighbors].sort((a, b) => b.students - a.students)[0];
    return `${district}에서는 ${maxSchool.name}의 학생 수가 가장 많아 학교 규모 차이를 비교하기 좋습니다.`;
  }

  if (appState.selectedDataset === "trend") {
    const rows = realLikeData.educationStats.filter((r) => r.district === district);
    const diff = rows[rows.length - 1].middleStudents - rows[0].middleStudents;
    return `${district}의 최근 학생 수 변화는 ${diff > 0 ? "+" : ""}${diff}명입니다.`;
  }

  if (appState.selectedDataset === "env") {
    const rows = realLikeData.airQuality.filter((r) => r.district === district);
    const avg = Math.round(rows.reduce((s, r) => s + r.pm25, 0) / rows.length);
    return `${district}의 평균 PM2.5 값은 ${avg}입니다.`;
  }

  if (appState.selectedDataset === "schoolEnv") {
    const rows = realLikeData.schoolEnvironment.filter((r) =>
      getNeighborSchools().some((s) => s.schoolId === r.schoolId)
    );
    const avg = Math.round(rows.reduce((s, r) => s + r.pm25, 0) / rows.length);
    return `주변 학교의 학교별 환경 데이터를 보면 평균 PM2.5는 ${avg}이며, 학교별 실내환경 비교 탐구에 활용할 수 있습니다.`;
  }

  const solarRows = realLikeData.solarStats.filter((r) =>
    getNeighborSchools().some((s) => s.schoolId === r.schoolId)
  );
  const installedCount = solarRows.filter((r) => r.hasSolar).length;
  const totalGeneration = solarRows.reduce((sum, r) => sum + (r.generationKwh || 0), 0);

  return `주변 학교 ${solarRows.length}개교 중 ${installedCount}개교가 태양광을 설치했고, 총 발전량은 ${totalGeneration.toLocaleString()}kWh입니다.`;
}

function getDatasetChartData() {
  const mySchool = getMySchool();
  const district = mySchool?.district;

  if (appState.selectedDataset === "school") {
    return getNeighborSchools().map((s) => ({ label: s.name, value: s.students }));
  }

  if (appState.selectedDataset === "trend") {
    return realLikeData.educationStats
      .filter((row) => row.district === district)
      .map((row) => ({ label: String(row.year), value: row.middleStudents }));
  }

  if (appState.selectedDataset === "env") {
    return realLikeData.airQuality
      .filter((row) => row.district === district)
      .map((row) => ({
        label: `${row.year}.${String(row.month).padStart(2, "0")}`,
        value: row.pm25
      }));
  }

  if (appState.selectedDataset === "schoolEnv") {
    const latestYear = 2025;
    return realLikeData.schoolEnvironment
      .filter((row) =>
        row.year === latestYear &&
        getNeighborSchools().some((s) => s.schoolId === row.schoolId)
      )
      .map((row) => {
        const school = realLikeData.schools.find((s) => s.schoolId === row.schoolId);
        return {
          label: school ? school.name : row.schoolId,
          value: row.pm25
        };
      });
  }

  if (appState.selectedDataset === "solar") {
    return realLikeData.solarStats
      .filter((row) => getNeighborSchools().some((s) => s.schoolId === row.schoolId))
      .map((row) => ({
        label: `${row.schoolName} (${row.hasSolar ? "설치" : "미설치"})`,
        value: row.generationKwh || 0
      }));
  }

  return [];
}

function renderSimpleChart(targetId, data = []) {
  const target = document.getElementById(targetId);
  if (!target) return;

  if (!data.length) {
    target.innerHTML = `<div style="padding:16px; color:#666;">표시할 데이터가 없습니다.</div>`;
    return;
  }

  const maxValue = Math.max(...data.map(item => Number(item.value) || 0), 1);

  target.innerHTML = `
  <div style="
    display:flex;
    flex-direction:column;
    gap:10px;
    max-height:420px;
    overflow-y:auto;
    padding-right:8px;
  ">
      ${data.map(item => {
    const value = Number(item.value) || 0;
    const width = Math.max(4, (value / maxValue) * 100);

    return `
          <div style="display:grid; grid-template-columns:120px 1fr 56px; gap:10px; align-items:center;">
            <div style="font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${item.label}
            </div>
            <div style="background:#e9eef5; border-radius:999px; height:14px; overflow:hidden;">
              <div style="width:${width}%; height:100%; background:#4f46e5; border-radius:999px;"></div>
            </div>
            <div style="font-size:13px; text-align:right;">${value}</div>
          </div>
        `;
  }).join("")}
    </div>
  `;
}

function buildLessonPlanPrompt() {
  const mySchool = getMySchool();
  const issue = getIssueContent();
  const datasetName = datasetLabels[appState.selectedDataset];
  const chartInsight = getDatasetInsight();
  const neighbors = getNeighborSchools();
  const standardsBlock = buildStandardsPromptBlock();

  return `
한 중등 교사가 지역 데이터를 활용한 탐구수업을 설계하려고 한다.

수업 조건은 다음과 같다.
- 학교급: ${appState.schoolLevel}
- 과목: ${appState.subject}
- 수업 형태: ${appState.classType}
- 기자재 환경: ${appState.equipment}
- 수업 목표: ${appState.goal}
- 학생 참여 수준: ${appState.level}

학교와 지역 맥락은 다음과 같다.
- 우리 학교: ${mySchool ? mySchool.name : "-"}
- 생활권: ${mySchool ? mySchool.district : "-"}
- 비교 가능한 주변 학교 수: ${neighbors.length}개교
- 선택한 지역문제: ${issue.title}
- 선택한 데이터: ${datasetName}
- 데이터 해석 포인트: ${chartInsight}

${standardsBlock}

반드시 다음 조건을 지켜 수업안을 작성하라.
1. 선택한 성취기준이 수업 목표, 탐구 질문, 차시 활동, 평가 포인트에 직접 드러나야 한다.
2. 각 차시 목표 옆에 어떤 성취기준이 연결되는지 명시하라.
3. 하위 질문은 성취기준의 동사(설명한다, 비교한다, 해석한다, 추론한다, 제안한다 등)가 드러나게 작성하라.
4. 활동은 반드시 데이터 읽기 → 해석 → 결론/제안의 흐름을 가지게 하라.
5. 출력 형식은 아래 JSON 구조를 따르라.

{
  "mainQuestion": "문자열",
  "subQuestions": ["문자열", "문자열", "문자열"],
  "lessonGoals": ["문자열", "문자열", "문자열"],
  "standardLinks": [
    {
      "code": "성취기준 코드",
      "text": "성취기준 내용",
      "appliedTo": ["핵심 질문", "1차시 목표", "평가 요소"]
    }
  ],
  "lessonFlow": [
    {
      "title": "문자열",
      "goal": "문자열",
      "standardCodes": ["코드1", "코드2"],
      "activities": ["문자열", "문자열", "문자열"],
      "wrapUp": "문자열",
      "nextConnection": "문자열"
    }
  ]
}
`.trim();
}

function buildOutputsPrompt() {
  const lesson = appState.aiLessonPlan;
  const issue = getIssueContent();
  const mySchool = getMySchool();
  const standardsBlock = buildStandardsPromptBlock();

  return `
한 중등 교사가 아래 수업안을 바탕으로 실제 수업 자료를 만들려고 한다.

기본 정보:
- 학교급: ${appState.schoolLevel}
- 과목: ${appState.subject}
- 우리 학교: ${mySchool ? mySchool.name : "-"}
- 지역문제: ${issue.title}
- 활용 자료: ${datasetLabels[appState.selectedDataset]}

이미 설계된 수업안:
- 핵심 탐구 질문: ${lesson?.mainQuestion || ""}
- 하위 질문: ${(lesson?.subQuestions || []).join(" | ")}
- 수업 목표: ${(lesson?.lessonGoals || []).join(" | ")}
- 수업 흐름: ${(lesson?.lessonFlow || [])
      .map((x) => `${x.title}: ${(x.activities || []).join(", ")}`)
      .join(" | ")}

${standardsBlock}

다음을 반드시 지켜라.
1. 활동지의 각 문항 옆에 연결된 성취기준 코드를 표시하라.
2. 루브릭의 각 평가 요소가 어떤 성취기준과 연결되는지 표시하라.
3. 발표자료 개요에도 성취기준이 반영된 분석-해석-제안 구조를 유지하라.
4. 출력 형식은 아래 JSON 구조를 따르라.

{
  "worksheet": [
    {
      "question": "문항 내용",
      "standardCodes": ["코드1"]
    }
  ],
  "rubric": [
    {
      "criterion": "평가 요소",
      "standardCodes": ["코드1", "코드2"],
      "high": "상 수준",
      "mid": "중 수준",
      "low": "하 수준"
    }
  ],
  "slides": ["문자열", "문자열", "문자열"]
}
`.trim();
}


function setLoadingState(active, title = "AI가 생성 중입니다", steps = []) {
  const overlay = document.getElementById("loading-overlay");
  const titleEl = document.getElementById("loading-title");
  const statusEl = document.getElementById("loading-status");
  const listEl = document.getElementById("loading-steps");

  if (!overlay) return;

  if (!active) {
    overlay.classList.add("hidden");
    listEl.innerHTML = "";
    statusEl.textContent = "";
    clearInterval(appState.loadingTimer);
    appState.loadingTimer = null;
    return;
  }

  titleEl.textContent = title;
  statusEl.textContent = "잠시만 기다려 주세요.";
  listEl.innerHTML = steps
    .map((step, index) => `<li data-step-index="${index}">${step}</li>`)
    .join("");

  overlay.classList.remove("hidden");
}

function updateLoadingProgress(label, stepIndex = null) {
  const statusEl = document.getElementById("loading-status");
  const items = [...document.querySelectorAll("#loading-steps li")];

  if (statusEl) statusEl.textContent = label;

  if (stepIndex !== null) {
    items.forEach((item, idx) => {
      item.classList.toggle("active", idx === stepIndex);
      item.classList.toggle("done", idx < stepIndex);
    });
  }
}

function startFakeProgress() {
  const labels = [
    "입력 조건을 정리하고 있습니다.",
    "데이터 맥락을 연결하고 있습니다.",
    "수업 구조를 설계하고 있습니다.",
    "응답 형식을 점검하고 있습니다."
  ];

  let idx = 0;
  updateLoadingProgress(labels[0], 0);

  clearInterval(appState.loadingTimer);
  appState.loadingTimer = setInterval(() => {
    idx = Math.min(idx + 1, labels.length - 1);
    updateLoadingProgress(labels[idx], idx);
  }, 1400);
}

async function loadCurriculumJson() {
  const res = await fetch("./science_curriculum_2022_checkbox.json");
  if (!res.ok) throw new Error("교육과정 JSON을 불러오지 못했습니다.");
  return await res.json();
}

function getSelectedStandardsFromUI() {
  const checked = document.querySelectorAll(".standard-checkbox:checked");

  return Array.from(checked).map((el) => ({
    achievement_code: el.dataset.code,
    achievement_text: el.dataset.text,
    display_text: el.dataset.display,
    course: el.dataset.course,
    unit: el.dataset.unit,
    school_level: el.dataset.schoolLevel
  }));
}

function refreshSelectedStandards() {
  appState.selectedStandards = getSelectedStandardsFromUI();
  return appState.selectedStandards;
}

function buildSelectedStandardsText() {
  const selected = refreshSelectedStandards();

  if (!selected.length) {
    return "선택한 성취기준 없음";
  }

  return selected
    .map((item) => `- ${item.display_text || `[${item.achievement_code}] ${item.achievement_text}`}`)
    .join("\n");
}

function buildStandardsPromptBlock() {
  const selected = refreshSelectedStandards();

  if (!selected.length) return "";

  return [
    "다음 성취기준을 반드시 반영하여 작성하라.",
    "",
    "[성취기준]",
    ...selected.map((item) => `- ${item.achievement_code}: ${item.achievement_text}`),
    ""
  ].join("\n");
}

function updateSelectedStandardsPreview() {
  const preview = document.getElementById("selectedStandardsPreview");
  if (!preview) return;

  const selected = getSelectedStandardsFromUI();
  appState.selectedStandards = selected;

  if (!selected.length) {
    preview.textContent = "아직 선택된 성취기준이 없습니다.";
    return;
  }

  preview.innerHTML = selected
    .map((item) => `<div class="selected-standard-item">${item.display_text}</div>`)
    .join("");
}


function renderCurriculumStandards() {
  const area = document.getElementById("curriculumArea");
  if (!area || !appState.curriculumData) return;

  area.innerHTML = "";

  let courses = appState.curriculumData.courses.filter(
    (course) =>
      course.school_level === appState.schoolLevel &&
      course.course === appState.subject
  );

  if (!courses.length) {
    area.innerHTML = `<p>표시할 성취기준이 없습니다.</p>`;
    updateSelectedStandardsPreview();
    return;
  }

  courses.forEach((courseObj) => {
    const courseBlock = document.createElement("div");
    courseBlock.className = "course-block";

    const courseTitle = document.createElement("h3");
    courseTitle.textContent = `${courseObj.school_level} · ${courseObj.course}`;
    courseBlock.appendChild(courseTitle);

    courseObj.units.forEach((unitObj) => {
      const unitBlock = document.createElement("div");
      unitBlock.className = "unit-block";

      const unitTitle = document.createElement("div");
      unitTitle.className = "unit-title";
      unitTitle.textContent = unitObj.unit;
      unitBlock.appendChild(unitTitle);

      unitObj.standards.forEach((std) => {
        const label = document.createElement("label");
        label.className = "standard-label";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "standard-checkbox";
        checkbox.dataset.code = std.achievement_code;
        checkbox.dataset.text = std.achievement_text;
        checkbox.dataset.display = std.display_text;
        checkbox.dataset.course = courseObj.course;
        checkbox.dataset.unit = unitObj.unit;
        checkbox.dataset.schoolLevel = courseObj.school_level;

        const alreadySelected = appState.selectedStandards.some(
          (item) => item.achievement_code === std.achievement_code
        );
        checkbox.checked = alreadySelected;

        checkbox.addEventListener("change", updateSelectedStandardsPreview);

        label.appendChild(checkbox);
        label.append(` ${std.display_text}`);

        unitBlock.appendChild(label);
      });

      courseBlock.appendChild(unitBlock);
    });

    area.appendChild(courseBlock);
  });

  updateSelectedStandardsPreview();
}

async function initCurriculum() {
  try {
    appState.curriculumData = await loadCurriculumJson();
    renderCurriculumStandards();
  } catch (error) {
    console.error("교육과정 로딩 실패:", error);
  }
}

function getIssueContent() {
  const mySchool = getMySchool();
  const district = mySchool ? mySchool.district : "생활권";
  const schoolName = mySchool ? mySchool.name : "우리 학교";

  return {
    dust: {
      title: "미세먼지",
      dataRecommendations: [
        { name: "학교 현황 데이터", text: `${schoolName}와 주변 학교의 학생 수·과학실 수를 비교합니다.` },
        { name: "생활권 학생 수 데이터", text: `${district}의 학생 수 변화를 참고해 생활 환경 맥락을 해석합니다.` },
        { name: "생활권 환경 데이터", text: `${district}의 월별 PM2.5 변화를 바탕으로 지역문제를 탐구합니다.` }
      ],
      previewQuestions: [
        `${schoolName}가 속한 ${district}의 미세먼지 변화는 학생 생활 환경과 어떤 관계가 있을까?`,
        `우리 학교와 주변 학교의 탐구 환경 차이는 어떤 특징을 보일까?`,
        `학생이 실천할 수 있는 지역 환경 개선 방안은 무엇일까?`
      ],
      mainQuestion: `${schoolName}가 속한 ${district}의 미세먼지 변화는 학생의 생활 환경과 어떤 관계가 있을까?`,
      subQuestions: [
        `${district}의 월별 미세먼지 농도는 어떻게 달라지는가?`,
        `${schoolName}와 주변 학교의 규모 및 과학실 수 차이는 탐구 활동 운영에 어떤 영향을 줄 수 있는가?`,
        `학생이 실천할 수 있는 해결 방안은 무엇인가?`
      ],
      lessonGoals: [
        "우리 학교가 속한 지역 데이터를 활용해 환경 문제를 과학적으로 해석할 수 있다.",
        "우리 학교와 주변 학교의 탐구 조건 차이를 비교할 수 있다.",
        "문제 해결 방안을 논리적으로 제시할 수 있다."
      ],
      lessonFlow: [
        {
          title: "1차시 · 우리 생활권의 미세먼지, 어떤 특징이 있을까?",
          goal: "생활권의 미세먼지 데이터와 학교 주변 환경을 연결해 문제 상황을 이해한다.",
          activities: [
            `${district}의 월별 PM2.5 데이터를 살펴보고 변화 경향을 찾는다.`,
            `${schoolName}와 주변 학교의 규모 및 과학실 수를 비교하며 탐구 환경 차이를 정리한다.`,
            "미세먼지 변화가 학생 생활과 수업 환경에 어떤 영향을 줄 수 있을지 모둠별로 추론한다."
          ],
          wrapUp: "지역 환경 데이터와 학교 환경 자료를 함께 보면 문제를 더 입체적으로 해석할 수 있음을 정리한다.",
          nextConnection: "다음 차시에서 미세먼지 문제의 원인을 해석하고 학생 실천 방안을 구체적으로 제안한다."
        },
        {
          title: "2차시 · 미세먼지 문제를 줄이기 위한 실천 방안은 무엇일까?",
          goal: "미세먼지 문제를 해석하고 학생이 실천할 수 있는 해결 방안을 제안한다.",
          activities: [
            "전 차시의 데이터 해석 결과를 바탕으로 미세먼지 문제의 주요 원인을 정리한다.",
            "우리 학교와 생활권에서 실천 가능한 대응 방법을 개인, 학교, 지역 수준으로 나누어 생각한다.",
            "모둠별 해결 방안을 발표하고 다른 모둠의 의견과 비교해 보완한다."
          ],
          wrapUp: "데이터 해석을 바탕으로 한 해결 방안이 더 설득력 있는 제안이 될 수 있음을 확인한다.",
          nextConnection: "환경 문제를 생활 속 실천 과제와 연결하는 후속 탐구로 확장할 수 있다."
        }
      ]
    },

    safety: {
      title: "통학 안전",
      dataRecommendations: [
        { name: "학교 현황 데이터", text: `${schoolName}와 주변 학교의 학생 수를 비교해 통학 혼잡 가능성을 추론합니다.` },
        { name: "생활권 학생 수 데이터", text: `${district}의 학생 수 변화를 통해 통학 환경 변화를 해석합니다.` },
        { name: "학사일정 데이터", text: `프로젝트 수업이나 안전 캠페인 적용 시점을 구상합니다.` }
      ],
      previewQuestions: [
        `${schoolName}와 주변 학교 중 학생 수가 많은 학교는 어디일까?`,
        `${district}의 학생 수 변화는 통학 환경과 어떤 관련이 있을까?`,
        `학생이 제안할 수 있는 안전 개선 방안은 무엇일까?`
      ],
      mainQuestion: `${schoolName}와 주변 학교의 규모는 통학 안전 문제와 어떤 관련이 있을까?`,
      subQuestions: [
        `학생 수가 많은 학교에서는 어떤 통학 안전 문제가 예상되는가?`,
        `${district}의 학생 수 변화는 통학 혼잡과 어떤 관련이 있을까?`,
        `학생이 제안할 수 있는 실천적 개선 방안은 무엇인가?`
      ],
      lessonGoals: [
        "우리 학교와 주변 학교 규모를 기반으로 통학 안전 문제를 분석할 수 있다.",
        "지역 데이터를 바탕으로 실생활 문제를 합리적으로 해석할 수 있다.",
        "학생 관점에서 개선 방안을 제안할 수 있다."
      ],
      lessonFlow: [
        {
          title: "1차시 · 우리 학교 통학 환경은 얼마나 안전할까?",
          goal: "우리 학교와 주변 학교의 규모를 비교하며 통학 안전 문제를 예측한다.",
          activities: [
            `${schoolName}와 주변 학교의 학생 수를 비교해 통학 혼잡 가능성을 살펴본다.`,
            "학생 수가 많은 학교일수록 어떤 통학 위험 요소가 생길 수 있을지 모둠별로 정리한다.",
            "학교 규모와 통학 환경 사이의 관계를 뒷받침할 수 있는 근거를 찾아본다."
          ],
          wrapUp: "학교 규모는 통학 안전 문제를 예상하는 하나의 중요한 단서가 될 수 있음을 정리한다.",
          nextConnection: "다음 차시에서 생활권 학생 수 변화를 연결해 통학 문제를 더 넓은 관점에서 해석한다."
        },
        {
          title: "2차시 · 더 안전한 통학 환경을 만들려면?",
          goal: "생활권 변화와 통학 문제를 연결해 학생 관점의 개선 방안을 제안한다.",
          activities: [
            `${district}의 학생 수 변화 추이를 살펴보며 통학 환경 변화 가능성을 해석한다.`,
            "통학 시간, 혼잡 구간, 보행 안전 등 실제 문제 상황을 가정해 해결 방안을 구상한다.",
            "모둠별로 안전 개선 아이디어를 발표하고 실천 가능성을 함께 검토한다."
          ],
          wrapUp: "통학 안전 문제는 학교 안의 문제가 아니라 지역 사회 환경과 연결된 문제임을 확인한다.",
          nextConnection: "학생 생활과 밀접한 다른 지역 문제 탐구로 이어질 수 있다."
        }
      ]
    },

    students: {
      title: "학생 수 변화",
      dataRecommendations: [
        { name: "생활권 학생 수 데이터", text: `${district}의 최근 학생 수 변화를 확인합니다.` },
        { name: "학교 현황 데이터", text: `${schoolName}와 주변 학교의 규모·과학실 수를 함께 비교합니다.` },
        { name: "학사일정 데이터", text: `프로젝트 적용 가능 시기를 함께 고려합니다.` }
      ],
      previewQuestions: [
        `${district}의 학생 수 변화는 어떤 추세를 보일까?`,
        `${schoolName}와 주변 학교의 환경 차이는 어떤 특징을 보일까?`,
        `학생 수 변화에 대응하기 위한 방안은 무엇일까?`
      ],
      mainQuestion: `${district}의 학생 수 변화는 학교 교육환경과 어떤 관계가 있을까?`,
      subQuestions: [
        `${district}의 최근 학생 수 변화는 어떻게 나타나는가?`,
        `${schoolName}와 주변 학교의 규모 및 과학실 수 차이는 어떤 특징을 보이는가?`,
        `지역 교육환경을 유지하거나 개선하기 위한 방안은 무엇인가?`
      ],
      lessonGoals: [
        "생활권 학생 수 변화 추이를 데이터로 해석할 수 있다.",
        "우리 학교와 주변 학교 환경 차이를 설명할 수 있다.",
        "교육 문제 해결 방안을 제안할 수 있다."
      ],
      lessonFlow: [
        {
          title: "1차시 · 우리 생활권의 학생 수는 어떻게 변하고 있을까?",
          goal: "생활권 학생 수 추이를 읽고 변화의 특징을 설명한다.",
          activities: [
            `${district}의 최근 학생 수 데이터를 비교하며 증가 또는 감소 추세를 파악한다.`,
            "변화가 두드러지는 시점이 있는지 확인하고 그 이유를 모둠별로 추론한다.",
            "학생 수 변화가 학교 운영과 교육환경에 어떤 영향을 줄 수 있을지 예측한다."
          ],
          wrapUp: "학생 수 변화는 단순한 숫자 변화가 아니라 학교 환경 변화와 연결되는 중요한 자료임을 정리한다.",
          nextConnection: "다음 차시에서 우리 학교와 주변 학교의 환경 차이를 함께 살펴보며 교육환경 문제로 확장한다."
        },
        {
          title: "2차시 · 학생 수 변화는 학교 교육환경과 어떤 관련이 있을까?",
          goal: "학교 환경 자료를 활용해 학생 수 변화가 교육환경에 미치는 영향을 해석한다.",
          activities: [
            `${schoolName}와 주변 학교의 학생 수, 교원 수, 과학실 수를 비교한다.`,
            "학생 수 변화가 수업 환경, 시설 활용, 교육 기회에 어떤 영향을 줄 수 있을지 토의한다.",
            "지역 교육환경을 유지하거나 개선하기 위한 방안을 모둠별로 제안한다."
          ],
          wrapUp: "학생 수 변화는 교육환경의 질과 연결되므로 지역 차원의 해석이 필요함을 확인한다.",
          nextConnection: "지역 교육 문제 해결을 위한 제안 활동이나 정책 제안형 탐구로 이어질 수 있다."
        }
      ]
    },

    energy: {
      title: "에너지 사용",
      dataRecommendations: [
        { name: "학교 현황 데이터", text: `${schoolName}와 주변 학교의 학생 수·교실 수·시설 수를 참고합니다.` },
        { name: "태양광 설치·발전량 데이터", text: `${schoolName}와 주변 학교의 태양광 설치 여부와 발전량을 비교합니다.` },
        { name: "생활권 학생 수 데이터", text: `${district}의 학교 운영 규모를 이해하는 보조 자료로 활용합니다.` }
      ],
      previewQuestions: [
        `${schoolName}와 주변 학교 중 에너지 사용이 많을 것으로 예상되는 곳은 어디일까?`,
        `과학실·컴퓨터실 수는 에너지 사용 추론에 어떤 도움이 될까?`,
        `학생이 실천할 수 있는 에너지 절감 방안은 무엇일까?`
      ],
      mainQuestion: `${schoolName}와 주변 학교의 규모와 시설 수는 에너지 사용 문제와 어떤 관계가 있을까?`,
      subQuestions: [
        `학생 수와 교실 수가 많은 학교는 어떤 에너지 사용 특성을 가질까?`,
        `과학실과 컴퓨터실 수는 어떤 근거가 될 수 있는가?`,
        `학생이 실천할 수 있는 절감 방안은 무엇인가?`
      ],
      lessonGoals: [
        "우리 학교와 주변 학교 자료를 바탕으로 에너지 사용 문제를 추론할 수 있다.",
        "생활 속 과학 문제를 해결 중심으로 탐구할 수 있다.",
        "실천 가능한 절감 방안을 제안할 수 있다."
      ],
      lessonFlow: [
        {
          title: "1차시 · 우리 학교 에너지, 얼마나 쓰고 있을까?",
          goal: "학교별 에너지 사용 데이터를 비교하고 차이의 원인을 추론한다.",
          activities: [
            "우리 학교와 주변 학교의 에너지 사용 데이터를 비교한다.",
            "학생 수, 교실 수, 시설 수를 연결해 사용 차이를 해석한다.",
            "모둠별로 주요 특징과 원인을 정리해 발표한다."
          ],
          wrapUp: "학교 규모와 시설 환경이 에너지 사용에 영향을 줄 수 있음을 정리한다.",
          nextConnection: "다음 차시에서 우리 학교의 에너지 절감 방안을 구체적으로 설계한다."
        },
        {
          title: "2차시 · 우리 학교를 위한 에너지 히어로!",
          goal: "에너지 낭비 요인을 찾고 실천 가능한 절감 방안을 제안한다.",
          activities: [
            "우리 학교에서 에너지가 낭비될 수 있는 상황을 찾는다.",
            "모둠별로 에너지 절약 아이디어를 브레인스토밍한다.",
            "포스터나 발표자료 형태로 실천 방안을 제안한다."
          ],
          wrapUp: "실천 가능한 행동부터 학교 차원의 제안까지 함께 정리한다.",
          nextConnection: "학생 생활 속 실천과 지역사회 문제 해결로 탐구를 확장한다."
        }
      ]
    },

    green: {
      title: "녹지 환경",
      dataRecommendations: [
        { name: "생활권 환경 데이터", text: `${district}의 환경 특성을 해석합니다.` },
        { name: "학교 현황 데이터", text: `${schoolName}와 주변 학교의 분포 및 규모를 함께 비교합니다.` },
        { name: "생활권 학생 수 데이터", text: `생활 환경의 질과 교육 수요를 함께 해석합니다.` }
      ],
      previewQuestions: [
        `${schoolName}가 속한 ${district}의 환경은 어떤 특징을 보일까?`,
        `주변 학교 규모와 생활권 특성을 함께 보면 어떤 차이를 찾을 수 있을까?`,
        `학생이 제안할 수 있는 생활 환경 개선 방안은 무엇일까?`
      ],
      mainQuestion: `${district}의 환경은 학생의 생활 환경과 어떤 관계가 있을까?`,
      subQuestions: [
        `${district}의 환경 자료는 어떤 특징을 보이는가?`,
        `${schoolName}와 주변 학교의 규모 차이는 생활 환경 탐구에 어떤 단서를 주는가?`,
        `학생이 제안할 수 있는 개선 방안은 무엇인가?`
      ],
      lessonGoals: [
        "생활 환경과 지역 환경의 관계를 해석할 수 있다.",
        "우리 학교와 주변 학교 데이터를 연결해 과학적 탐구를 수행할 수 있다.",
        "생활 환경 개선 방안을 제안할 수 있다."
      ],
      lessonFlow: [
        {
          title: "1차시 · 우리 생활권의 환경은 어떤 특징이 있을까?",
          goal: "생활권의 환경 자료와 학교 분포를 함께 살펴보며 생활 환경의 특징을 이해한다.",
          activities: [
            `${district}의 환경 자료를 살펴보며 생활권의 특징을 정리한다.`,
            `${schoolName}와 주변 학교의 규모와 분포를 비교하며 학교 환경과 지역 환경의 연결점을 찾아본다.`,
            "환경 특성이 학생 생활에 어떤 영향을 줄 수 있을지 모둠별로 토의한다."
          ],
          wrapUp: "지역 환경과 학교 환경은 분리된 것이 아니라 서로 영향을 주고받는 관계임을 정리한다.",
          nextConnection: "다음 차시에서 학생 생활 환경을 개선할 수 있는 실천 방안을 더 구체적으로 제안한다."
        },
        {
          title: "2차시 · 더 나은 생활 환경을 만들기 위해 무엇을 할 수 있을까?",
          goal: "생활 환경 개선을 위한 실천 방안을 학생 관점에서 제안한다.",
          activities: [
            "우리 학교와 생활권에서 개선이 필요하다고 생각하는 환경 요소를 정리한다.",
            "학생이 직접 실천할 수 있는 방안과 학교 또는 지역 차원의 개선 방안을 구분해 생각한다.",
            "모둠별 제안을 발표하고 가장 실천 가능성이 높은 아이디어를 함께 선정한다."
          ],
          wrapUp: "생활 환경 문제는 지역 자료를 해석한 뒤 구체적인 행동으로 이어질 때 더 의미가 커짐을 확인한다.",
          nextConnection: "지역 환경 캠페인, 학교 공간 개선 프로젝트 등으로 탐구를 이어갈 수 있다."
        }
      ]
    }
  }[appState.selectedIssue];
}

function renderSchoolDataTable() {
  const mySchool = getMySchool();
  const neighbors = getNeighborSchools();
  const table = document.getElementById("school-data-table");
  const desc = document.getElementById("school-panel-desc");

  desc.textContent = mySchool
    ? `${mySchool.name}이(가) 속한 ${mySchool.district}의 주변 학교 데이터를 비교합니다.`
    : "주변 학교 데이터를 비교합니다.";

  table.innerHTML = `
    <thead>
      <tr>
        <th>선택</th>
        <th>학교명</th>
        <th>생활권</th>
        <th>학생 수</th>
        <th>교원 수</th>
        <th>과학실 수</th>
        <th>컴퓨터실 수</th>
        <th>설립연도</th>
      </tr>
    </thead>
    <tbody>
      ${neighbors.map((school) => `
        <tr class="${school.schoolId === appState.mySchoolId ? "school-row-highlight" : ""}">
          <td>${school.schoolId === appState.mySchoolId ? "★" : ""}</td>
          <td>${school.name}</td>
          <td>${school.district}</td>
          <td>${school.students}</td>
          <td>${school.teachers}</td>
          <td>${school.scienceLabs}</td>
          <td>${school.computerLabs}</td>
          <td>${school.yearFounded}</td>
        </tr>
      `).join("")}
    </tbody>
  `;
}

function renderIssueData() {
  const content = getIssueContent();
  const dataBox = document.getElementById("data-recommendations");
  const questionList = document.getElementById("question-preview-list");
  const insight = document.getElementById("preview-insight");
  const chartTitle = document.getElementById("preview-chart-title");

  dataBox.innerHTML = "";
  questionList.innerHTML = "";

  content.dataRecommendations.forEach((item) => {
    const card = document.createElement("div");
    card.style.marginBottom = "12px";
    card.innerHTML = `
      <strong>${item.name}</strong>
      <p style="margin:6px 0 0; color:var(--sub);">${item.text}</p>
    `;
    dataBox.appendChild(card);
  });

  content.previewQuestions.forEach((q) => {
    const li = document.createElement("li");
    li.textContent = q;
    questionList.appendChild(li);
  });

  chartTitle.textContent = getDatasetChartTitle();
  renderSimpleChart("simple-chart", getDatasetChartData());
  insight.textContent = getDatasetInsight();
  renderSchoolDataTable();
}

function renderLessonPlan() {
  const content = appState.aiLessonPlan ?? {
  mainQuestion: "AI 수업안이 아직 생성되지 않았습니다.",
  subQuestions: [],
  lessonGoals: [],
  lessonFlow: [],
  standardLinks: []
};
  const mySchool = getMySchool();
  const neighbors = getNeighborSchools();

  renderSummary("design-summary");

  document.getElementById("design-summary").innerHTML += `
    <br><br>
    <strong>연결된 데이터 기반</strong><br>
    우리 학교: ${mySchool ? mySchool.name : "-"} · 비교 학교 수: ${neighbors.length}개교 · 선택 자료: ${datasetLabels[appState.selectedDataset]}
  `;

  document.getElementById("main-question").textContent = content.mainQuestion;

  const subQuestions = document.getElementById("sub-questions");
  const lessonGoals = document.getElementById("lesson-goals");
  const lessonFlow = document.getElementById("lesson-flow");
  const standardBox = document.getElementById("standard-links");
  if (standardBox) {
    const links = content.standardLinks || [];
    if (!links.length) {
      standardBox.innerHTML = "<p>성취기준 연결 정보가 없습니다.</p>";
    } else {
      standardBox.innerHTML = links.map(item => `
      <div class="standard-link-card">
        <strong>${item.code}</strong> ${item.text}
        <div style="margin-top:6px; color: var(--sub);">
          적용 위치: ${(item.appliedTo || []).join(", ")}
        </div>
      </div>
    `).join("");
    }
  }
  subQuestions.innerHTML = "";
  lessonGoals.innerHTML = "";
  lessonFlow.innerHTML = "";

  (content.subQuestions || []).forEach((q) => {
    const li = document.createElement("li");
    li.textContent = q;
    subQuestions.appendChild(li);
  });

  (content.lessonGoals || []).forEach((goal) => {
    const li = document.createElement("li");
    li.textContent = goal;
    lessonGoals.appendChild(li);
  });

  (content.lessonFlow || []).forEach((flow, index) => {
    const card = document.createElement("div");
    card.className = "lesson-step-card";

    const activitiesHtml = (flow.activities || [])
      .map((item) => `<li>${item}</li>`)
      .join("");

    card.innerHTML = `
      <div class="lesson-step-header">
        <div class="lesson-step-badge">${index + 1}차시</div>
        <h4>${flow.title || ""}</h4>
      </div>

      <div class="lesson-step-section">
        <div class="lesson-step-label">차시 목표</div>
        <p>${flow.goal || ""}</p>
      </div>

      <div class="lesson-step-section">
        <div class="lesson-step-label">주요 활동</div>
        <ol class="lesson-step-list">
          ${activitiesHtml}
        </ol>
      </div>

      <div class="lesson-step-grid">
        <div class="lesson-step-mini">
          <div class="lesson-step-label">정리</div>
          <p>${flow.wrapUp || ""}</p>
        </div>
        <div class="lesson-step-mini">
          <div class="lesson-step-label">다음 차시 연결</div>
          <p>${flow.nextConnection || ""}</p>
        </div>
      </div>
    `;

    lessonFlow.appendChild(card);
  });

  renderPromptModalContent();
}

function renderOutputs() {
  const lesson = appState.aiLessonPlan || getIssueContent();
  const output = appState.aiOutputs;
  const mySchool = getMySchool();

  const worksheetItems = output?.worksheet || [];
  const rubricRows = output?.rubric || [];
  const slides = output?.slides || [];

  document.getElementById("worksheet-content").innerHTML = `
    <h3>학생 활동지</h3>
    <p><strong>우리 학교:</strong> ${mySchool ? mySchool.name : "-"}</p>
    <p><strong>핵심 질문:</strong> ${lesson.mainQuestion}</p>
    <p><strong>활용 자료:</strong> ${datasetLabels[appState.selectedDataset]}</p>
    <ol class="ordered-list">
      ${worksheetItems.map((item) => `
        <li>
          ${item.question}
          <div style="margin-top:4px; color:var(--sub); font-size:13px;">
            성취기준: ${(item.standardCodes || []).join(", ")}
          </div>
        </li>
      `).join("")}
    </ol>
  `;

  document.getElementById("rubric-table").innerHTML = `
    <thead>
      <tr>
        <th>평가 요소</th>
        <th>성취기준</th>
        <th>상</th>
        <th>중</th>
        <th>하</th>
      </tr>
    </thead>
    <tbody>
      ${rubricRows.map((row) => `
        <tr>
          <td>${row.criterion}</td>
          <td>${(row.standardCodes || []).join(", ")}</td>
          <td>${row.high}</td>
          <td>${row.mid}</td>
          <td>${row.low}</td>
        </tr>
      `).join("")}
    </tbody>
  `;

  document.getElementById("slides-outline").innerHTML =
    slides.map((item) => `<li>${item}</li>`).join("");

  renderSimpleChart("final-chart", getDatasetChartData());
  document.getElementById("final-insight").textContent =
    "선택한 학교와 생활권 데이터를 바탕으로 AI가 생성한 수업 자료입니다.";
}

function renderPromptModalContent() {
  const mySchool = getMySchool();
  const standardsText = buildSelectedStandardsText();

  document.getElementById("prompt-step-1-meta").innerHTML = `
    학교급: ${appState.schoolLevel} / 과목: ${appState.subject} / 우리 학교: ${mySchool ? mySchool.name : "-"} / 자료: ${datasetLabels[appState.selectedDataset]}
  `;
  document.getElementById("prompt-step-1").textContent =
    `탐구 질문 생성 단계
- ${appState.schoolLevel} ${appState.subject} 수준으로 작성
- 우리 학교: ${mySchool ? mySchool.name : "-"}
- 선택 자료: ${datasetLabels[appState.selectedDataset]}
- 반영 성취기준:
${standardsText}
- 학생이 실제 데이터를 비교·해석할 수 있는 개방형 질문으로 구성`;

  document.getElementById("prompt-step-2-meta").innerHTML = `
    수업 형태: ${appState.classType} / 기자재 환경: ${appState.equipment}
  `;
  document.getElementById("prompt-step-2").textContent =
    `수업 구조 설계 단계
- ${appState.classType} 수업 구조
- 기자재 환경: ${appState.equipment}
- 반영 성취기준:
${standardsText}
- 우리 학교와 주변 학교 데이터를 비교하는 활동 포함
- 실제 교실에서 실행 가능한 흐름으로 구성`;

  document.getElementById("prompt-step-3-meta").innerHTML = `
    생성 대상: 학생 활동지 / 평가 루브릭 / 발표자료 초안
  `;
  document.getElementById("prompt-step-3").textContent =
    `수업 자료 생성 단계
- 학생 활동지, 평가 루브릭, 발표자료 초안 생성
- 반영 성취기준:
${standardsText}
- 선택 자료 "${datasetLabels[appState.selectedDataset]}"를 활용한 해석 활동 포함
- 교사가 바로 수정·활용할 수 있는 간결한 형식으로 제시`;
}

function toggleSchoolDataPanel() {
  const panel = document.getElementById("school-data-panel");
  const btn = document.getElementById("toggle-school-data-btn");
  const isHidden = panel.style.display === "none" || panel.style.display === "";
  panel.style.display = isHidden ? "block" : "none";
  btn.textContent = isHidden ? "학교 데이터 숨기기" : "학교 데이터 보기";
}

function updateStepHighlight(screenNumber) {
  const steps = document.querySelectorAll(".step");

  steps.forEach((step, index) => {
    const isActive = index === screenNumber - 1;
    step.classList.toggle("active", isActive);
  });
}

function showScreen(screenNumber) {
  const screens = document.querySelectorAll(".screen");
  screens.forEach((screen) => {
    screen.classList.remove("active");
    screen.style.display = "none";
  });

  const target = document.getElementById(`screen-${screenNumber}`);
  if (target) {
    target.classList.add("active");
    target.style.display = "block";
  }

  updateStepHighlight(screenNumber);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function switchTab(tabName) {
  const buttons = document.querySelectorAll(".tab-btn");
  const panes = document.querySelectorAll(".tab-content");

  buttons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  panes.forEach((pane) => {
    const isMatch =
      pane.id === `tab-${tabName}` || pane.dataset.tabContent === tabName;
    pane.classList.toggle("active", isMatch);
    pane.style.display = isMatch ? "block" : "none";
  });
}

function openModal() {
  const modal = document.getElementById("ai-modal");
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.style.display = "flex";
}

function closeModal() {
  const modal = document.getElementById("ai-modal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.style.display = "none";
}

function bindEvents() {
  document.getElementById("school-level").addEventListener("change", (e) => {
    appState.schoolLevel = e.target.value;
    populateSubjectSelect();
    populateSchoolSelect();

    appState.selectedStandards = [];
    renderCurriculumStandards();
  });

  document.getElementById("subject").addEventListener("change", (e) => {
    appState.subject = e.target.value;
    appState.selectedStandards = [];
    renderCurriculumStandards();
  });

  document.getElementById("start-design-btn").addEventListener("click", () => {
    updateStateFromForm();
    renderSummary("input-summary");
    renderDatasetTabs();
    renderIssueData();
    showScreen(2);
  });

  document.getElementById("toggle-school-data-btn").addEventListener("click", toggleSchoolDataPanel);

  document.querySelectorAll(".issue-card").forEach((card) => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".issue-card").forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      appState.selectedIssue = card.dataset.issue;
      renderIssueData();
    });
  });

  document.getElementById("generate-plan-btn").addEventListener("click", async () => {
    const btn = document.getElementById("generate-plan-btn");

    try {
      const selected = refreshSelectedStandards();
      if (!selected.length) {
        alert("성취기준을 1개 이상 선택해 주세요.");
        return;
      }

      btn.disabled = true;
      btn.textContent = "AI 수업안 생성 중...";

      setLoadingState(true, "AI가 수업안을 설계하고 있습니다", [
        "조건 확인",
        "데이터 연결",
        "수업안 생성",
        "결과 정리"
      ]);
      startFakeProgress();

      const prompt = buildLessonPlanPrompt();
      const result = await callLessonAPIStream(prompt, "plan", appState.fastMode);

      appState.aiLessonPlan = result;
      appState.lastImprovedPrompt = result._meta?.improvedPrompt || "";
      renderLessonPlan();
      showScreen(3);
    } catch (err) {
      alert("수업안 생성 중 오류가 발생했습니다: " + err.message);
    } finally {
      setLoadingState(false);
      btn.disabled = false;
      btn.textContent = "이 주제로 수업 설계하기";
    }
  });

  document.getElementById("generate-output-btn").addEventListener("click", async () => {
    const btn = document.getElementById("generate-output-btn");

    try {
      btn.disabled = true;
      btn.textContent = "산출물 생성 중...";

      if (!appState.aiLessonPlan) {
        throw new Error("먼저 AI 수업안을 생성해야 합니다.");
      }

      setLoadingState(true, "AI가 수업 자료를 만들고 있습니다", [
        "수업안 읽기",
        "활동지 생성",
        "루브릭 생성",
        "발표자료 정리"
      ]);
      startFakeProgress();

      const prompt = buildOutputsPrompt();
      const result = await callLessonAPIStream(prompt, "output", appState.fastMode);

      appState.aiOutputs = result;
      renderOutputs();
      showScreen(4);
    } catch (err) {
      alert("산출물 생성 중 오류가 발생했습니다: " + err.message);
    } finally {
      setLoadingState(false);
      btn.disabled = false;
      btn.textContent = "수업 산출물 생성";
    }
  });

  document.getElementById("open-ai-modal-btn").addEventListener("click", openModal);
  document.getElementById("close-ai-modal-btn").addEventListener("click", closeModal);
  document.getElementById("close-modal-overlay").addEventListener("click", closeModal);

  document.querySelectorAll("[data-prev]").forEach((btn) => {
    btn.addEventListener("click", () => showScreen(Number(btn.dataset.prev)));
  });

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  document.getElementById("restart-btn").addEventListener("click", () => showScreen(1));
  document.getElementById("save-pdf-btn").addEventListener("click", () => window.print());
}

async function init() {
  populateSubjectSelect();
  populateSchoolSelect();
  renderDatasetTabs();
  renderIssueData();
  renderSchoolDataTable();
  bindEvents();
  await initCurriculum();
  showScreen(1);
}

const API_BASE =
  location.hostname === "127.0.0.1" || location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://seed-backend-xso7.onrender.com";

async function callLessonAPI(prompt, mode = "plan", fastMode = true) {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt, mode, fastMode })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "AI 요청 실패");
  }

  return await res.json();
}

async function callLessonAPIStream(prompt, mode = "plan", fastMode = true) {
  const url = new URL(`${API_BASE}/api/generate-stream`);
  url.searchParams.set("prompt", prompt);
  url.searchParams.set("mode", mode);
  url.searchParams.set("fastMode", String(fastMode));

  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(url);

    eventSource.addEventListener("progress", (event) => {
      const data = JSON.parse(event.data);
      updateLoadingProgress(data.label, Math.max(0, (data.step || 1) - 1));
    });

    eventSource.addEventListener("result", (event) => {
      const data = JSON.parse(event.data);
      eventSource.close();
      resolve(data);
    });

    eventSource.addEventListener("error", () => {
      eventSource.close();
      reject(new Error("스트리밍 요청 중 문제가 발생했습니다."));
    });
  });
}

init();