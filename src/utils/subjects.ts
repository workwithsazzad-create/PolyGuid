export const subjectMap: Record<string, string> = {
  // 2022 Regulation Common Subjects
  "25911": "Mathematics-1",
  "25921": "Mathematics-2",
  "25931": "Mathematics-3",
  "25912": "Physics-1",
  "25922": "Physics-2",
  "25811": "Social Science",
  "25821": "Accounting theory & Practice",
  "25831": "Economics and Accounting",
  "25841": "Business Organization & Communication",
  "25812": "Physical Education & Life Skill",
  "25711": "Bangla-1",
  "25721": "Bangla-2",
  "25712": "English-1",
  "25722": "English-2",
  
  // Computer Tech subjects (example)
  "26611": "Computer Office Application",
  "26621": "Database Management System",
  "28511": "Computer Fundamentals",
  "28542": "Web Design & Development",

  // Electronics Tech subjects
  "26811": "Basic Electronics",
  "26821": "Advanced Electronics",
  "26831": "Digital Electronics",
  "26842": "Microcontroller & Embedded System",
  "26731": "Electrical Circuits & Machines",

  // 2016 Regulation Common Subjects
  "65911": "Mathematics-1",
  "65921": "Mathematics-2",
  "65931": "Mathematics-3",
  "65912": "Physics-1",
  "65922": "Physics-2",
  "65811": "Social Science",
  "65821": "Accounting theory & Practice",
  "65711": "Bangla-1",
  "65721": "Bangla-2",
  "65712": "English-1",
  "65722": "English-2",

  // Add more as needed
};

export function getSubjectName(codeWithSuffix: string): string {
  // Extract only the numbers from the code (e.g., "25921(T)" -> "25921")
  const code = codeWithSuffix.replace(/\D/g, "");
  
  return subjectMap[code] || "Subject Unknown";
}
