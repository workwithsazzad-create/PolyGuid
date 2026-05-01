import React, { forwardRef } from 'react';
import { BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SemesterResult {
  index: number;
  status: 'Passed' | 'Referred';
  gpa?: number | string;
  referred_subjects?: string[];
}

interface StudentResult {
  roll_no: string;
  polytechnic_name: string;
  regulation: string;
  department: string;
  semesters: SemesterResult[];
}

interface Props {
  result: StudentResult;
}

const ResultCertificate = forwardRef<HTMLDivElement, Props>(({ result }, ref) => {
  const allReferredSubjects = Array.from(new Set(result.semesters.flatMap(sem => sem.referred_subjects || [])));
  const totalReferred = allReferredSubjects.length;

  return (
    <div 
      ref={ref}
      style={{ width: '600px', backgroundColor: '#ffffff', color: '#000000', padding: '40px' }}
      className="font-sans"
    >
      {/* Heading */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
            <span style={{ color: '#32CD32' }}>P</span><span style={{ color: '#000000' }}>oly</span><span style={{ color: '#32CD32' }}>G</span><span style={{ color: '#000000' }}>uid</span>
        </h1>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0' }}>Roll No: {result.roll_no}</h2>
        <div style={{ fontSize: '14px', color: '#666', margin: '5px 0' }}>
          {result.department} | Regulation: {result.regulation}
        </div>
        <div style={{ fontSize: '14px', fontWeight: 'bold', margin: '5px 0' }}>{result.polytechnic_name}</div>
      </div>

      {/* Summary */}
      <div style={{ border: '2px solid #eee', padding: '20px', borderRadius: '15px', marginBottom: '30px', textAlign: 'center' }}>
        {totalReferred > 0 ? (
          <div style={{ color: '#dc2626', fontWeight: 'bold' }}>
            <span style={{ fontSize: '18px' }}>{totalReferred} {totalReferred === 1 ? 'Subject' : 'Subjects'} yet to pass</span>
            <div style={{ fontSize: '12px', marginTop: '5px' }}>Subject Codes: {allReferredSubjects.join(', ')}</div>
          </div>
        ) : (
          <div style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '18px' }}>Status: All Passed!</div>
        )}
      </div>

      {/* Academic History */}
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>Academic History</h3>
      
      <div style={{ display: 'grid', gap: '10px' }}>
        {result.semesters.map((sem, idx) => (
          <div key={idx} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                {sem.index === 1 ? '1st' : sem.index === 2 ? '2nd' : sem.index === 3 ? '3rd' : `${sem.index}th`} Semester
              </span>
              <span style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: sem.status === 'Passed' ? '#16a34a' : '#dc2626'
              }}>
                {sem.status}
              </span>
            </div>
            
            {sem.status === 'Passed' ? (
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#32CD32' }}>GPA: {Number(sem.gpa).toFixed(2)}</div>
            ) : (
                <div style={{ fontSize: '12px', color: '#dc2626' }}>
                    {sem.referred_subjects?.join(', ')}
                </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '10px', color: '#999' }}>
        Powered by PolyGuid. This result is formatted for easier viewing. For official purposes, refer to transcipts issued by BTEB.
      </div>
    </div>
  );
});

ResultCertificate.displayName = 'ResultCertificate';

export default ResultCertificate;
