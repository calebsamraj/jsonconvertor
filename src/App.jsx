import React, { useState, useEffect, useRef } from 'react';
import './index.css';

function App() {
  const [data, setData] = useState({});
  const [singleQ, setSingleQ] = useState("");
  const [singleA, setSingleA] = useState("");
  const [activeTab, setActiveTab] = useState("manual");
  const [isLoading, setIsLoading] = useState(false);
  const [isLogoSpinning, setIsLogoSpinning] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [jsonToTxtOutput, setJsonToTxtOutput] = useState("");
  const [txtSingleQ, setTxtSingleQ] = useState("");
  const [txtSingleA, setTxtSingleA] = useState("");
  
  const [isFirstVisit] = useState(() => {
    const visited = sessionStorage.getItem('hasVisited');
    if (!visited) {
      sessionStorage.setItem('hasVisited', 'true');
      return true;
    }
    return false;
  });

  const logoRef = useRef(null);

  useEffect(() => {
    if (isInitialLoading) {
      setTimeout(() => {
        if (logoRef.current) {
          const rect = logoRef.current.getBoundingClientRect();
          const centerX = window.innerWidth / 2;
          const centerY = window.innerHeight / 2;
          
          const moveX = centerX - (rect.left + rect.width / 2);
          const moveY = centerY - (rect.top + rect.height / 2);
          
          document.documentElement.style.setProperty('--move-x', `${moveX}px`);
          document.documentElement.style.setProperty('--move-y', `${moveY}px`);
        }
      }, 50); // Delay to let DOM render
    }

    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, [isInitialLoading]);

  const mergeData = (newData) => {
    setData((prev) => {
      const merged = { ...prev };
      for (const [key, value] of Object.entries(newData)) {
        if (!merged.hasOwnProperty(key)) {
          merged[key] = value;
        }
      }
      return merged;
    });
  };

  const handleJsonUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setTimeout(() => {
        try {
          const json = JSON.parse(event.target.result);
          if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
            mergeData(json);
          } else {
            alert('Invalid JSON format. Expected a flat dictionary.');
          }
        } catch (err) {
          alert('Failed to parse JSON file.');
        }
        setIsLoading(false);
      }, 800);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleJsonToTxtUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setTimeout(() => {
        try {
          const json = JSON.parse(event.target.result);
          if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
            let txtOutput = "";
            for (const [key, value] of Object.entries(json)) {
              txtOutput += `${key}\n\`\`\`\n${value}\n\`\`\`\n\n`;
            }
            setJsonToTxtOutput(txtOutput);
          } else {
            alert('Invalid JSON format. Expected a flat dictionary.');
          }
        } catch (err) {
          alert('Failed to parse JSON file.');
        }
        setIsLoading(false);
      }, 800);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleAddTxtSingle = () => {
    if (!txtSingleQ.trim() || !txtSingleA.trim()) {
      alert("Both Question and Answer are required.");
      return;
    }
    const newEntry = `${txtSingleQ.trim()}\n\`\`\`\n${txtSingleA.trim()}\n\`\`\`\n\n`;
    setJsonToTxtOutput(prev => prev + newEntry);
    setTxtSingleQ("");
    setTxtSingleA("");
  };

  const downloadJsonToTxt = () => {
    if (!jsonToTxtOutput) return;
    const blob = new Blob([jsonToTxtOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'converted_output.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const parseQAString = (text) => {
    const pairs = {};
    // Split by the ``` delimiter
    const parts = text.split('```');
    
    // Each Q&A pair is represented by 2 consecutive parts
    for (let i = 0; i < parts.length - 1; i += 2) {
      const q = parts[i].trim();
      const a = parts[i + 1] ? parts[i + 1].trim() : '';
      
      if (q && a) {
        pairs[q] = a;
      }
    }
    return pairs;
  };

  const handleTxtUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setTimeout(() => {
        const pairs = parseQAString(event.target.result);
        const count = Object.keys(pairs).length;
        
        if (count > 0) {
          mergeData(pairs);
          alert(`Successfully extracted ${count} Q&A pair(s) from ${file.name}.`);
        } else {
          alert(`Error: No valid Q&A pairs found in ${file.name}.\n\nPlease ensure your questions and answers are separated by exactly '\`\`\`'.`);
        }
        
        setIsLoading(false);
      }, 800);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleMultipleTxtUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsLoading(true);
    let allPairs = {};
    let filesProcessed = 0;
    let successCount = 0;
    let failedFiles = [];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const pairs = parseQAString(event.target.result);
        const count = Object.keys(pairs).length;
        
        if (count > 0) {
          allPairs = { ...allPairs, ...pairs };
          successCount += count;
        } else {
          failedFiles.push(file.name);
        }
        
        filesProcessed++;
        
        if (filesProcessed === files.length) {
          setTimeout(() => {
            if (Object.keys(allPairs).length > 0) {
              mergeData(allPairs);
            }
            setIsLoading(false);
            
            if (failedFiles.length === 0) {
               alert(`Successfully extracted ${successCount} Q&A pair(s) from ${files.length} file(s).`);
            } else if (successCount > 0) {
               alert(`Successfully extracted ${successCount} Q&A pair(s).\n\nFailed to parse ${failedFiles.length} file(s):\n${failedFiles.join(', ')}\n\nEnsure questions and answers are separated by '\`\`\`'.`);
            } else {
               alert(`Error: No valid Q&A pairs found in any of the uploaded files.\n\nPlease ensure your questions and answers are separated by exactly '\`\`\`'.`);
            }
          }, 800);
        }
      };
      reader.readAsText(file);
    });
    e.target.value = ''; // Reset input
  };

  const handleAddSingle = () => {
    if (!singleQ.trim() || !singleA.trim()) {
      alert("Please fill in both the question and the answer.");
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      mergeData({ [singleQ.trim()]: singleA.trim() });
      setSingleQ("");
      setSingleA("");
      setIsLoading(false);
    }, 400);
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exam_database.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearDatabase = () => {
    if (window.confirm("Are you sure you want to clear the entire database? This will permanently remove all files and questions you have uploaded.")) {
      setData({});
    }
  };

  return (
    <div className="container" style={{ position: 'relative' }}>
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '40vw',
        fontWeight: '900',
        color: 'var(--primary-color)',
        opacity: 0.05,
        pointerEvents: 'none',
        zIndex: -1,
        whiteSpace: 'nowrap',
        userSelect: 'none'
      }}>
        {'{ }'}
      </div>
      {isInitialLoading && (
        <>
          <div className="splash-backdrop"></div>
          <div className="splash-text">
            {isFirstVisit ? (
              <>
                convert panalama
                <svg viewBox="0 0 100 100" width="45" height="45" className="blink-eye" style={{ marginLeft: '12px', verticalAlign: 'middle' }}>
                  <path d="M10,50 C30,20 70,20 90,50 C70,80 30,80 10,50 Z" fill="none" stroke="currentColor" strokeWidth="8"/>
                  <circle cx="50" cy="50" r="16" fill="currentColor"/>
                </svg>
              </>
            ) : (
              "Easy to Convert!"
            )}
          </div>
        </>
      )}
      
      {isLoading && (
        <div className="loading-overlay">
          <img src="/logo.png" alt="Loading..." className="logo-loading" />
          <div className="loading-text">Processing...</div>
        </div>
      )}

      <header className="header">
        <div className="header-title">
          <img 
            ref={logoRef}
            src="/logo.png" 
            alt="Logo" 
            className={`logo ${isInitialLoading ? 'splash-logo-anim' : ''} ${!isInitialLoading && isLogoSpinning ? 'logo-spin' : ''}`} 
            onClick={() => { if (!isInitialLoading) setIsLogoSpinning(!isLogoSpinning); }}
            style={{ cursor: isInitialLoading ? 'default' : 'pointer' }}
            title={!isInitialLoading ? "Click me to spin!" : ""}
          />
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#8ab4f8', fontSize: '2.5rem', fontWeight: 900 }}>{'{'}</span>
            Q&A Database Builder
            <span style={{ color: '#c58af9', fontSize: '2.5rem', fontWeight: 900 }}>{'}'}</span>
          </h1>
        </div>
        <div className="status-badge" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <span>Total Pairs:</span>
            <strong>{Object.keys(data).length}</strong>
          </div>
          {Object.keys(data).length > 0 && (
            <button 
              className="btn btn-danger" 
              onClick={clearDatabase} 
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', backgroundColor: '#ef4444', borderColor: '#ef4444' }}
            >
              Clear Database
            </button>
          )}
        </div>
      </header>

      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`} onClick={() => setActiveTab('manual')}>Manual Entry</button>
        <button className={`tab-btn ${activeTab === 'bulk' ? 'active' : ''}`} onClick={() => setActiveTab('bulk')}>Single File Converter</button>
        <button className={`tab-btn ${activeTab === 'bulk-multi' ? 'active' : ''}`} onClick={() => setActiveTab('bulk-multi')}>Batch Files Converter</button>
        <button className={`tab-btn ${activeTab === 'json-to-txt' ? 'active' : ''}`} onClick={() => setActiveTab('json-to-txt')}>JSON to TXT</button>
        <button className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveTab('preview')}>Preview Database</button>
      </div>

      <main className="main-content">
        {activeTab === 'manual' && (
          <>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2>Start or Edit File</h2>
                  <p className="hint" style={{ color: '#8ab4f8' }}>Upload a JSON to edit, or click Create New File. Typing Q&A pairs below will build your file.</p>
                </div>
                <button 
                  className="btn" 
                  onClick={() => {
                    clearDatabase();
                  }} 
                  style={{ backgroundColor: '#ef4444', borderColor: '#ef4444', color: '#fff', fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                >
                  Create New File
                </button>
              </div>
              <div className="upload-btn-wrapper mt-3">
                <button className="btn">Upload JSON (Merge)</button>
                <input type="file" accept=".json" onChange={handleJsonUpload} />
              </div>
            </div>

            <div className="card">
              <h2>Add Q&A Pair</h2>
              <p className="hint">Enter a single question and answer below.</p>
              <div className="input-group">
                <label>Question</label>
                <textarea 
                  value={singleQ} 
                  onChange={(e) => setSingleQ(e.target.value)} 
                  placeholder="e.g. What is React?"
                  rows={2}
                />
              </div>
              <div className="input-group mt-3">
                <label>Answer</label>
                <textarea 
                  value={singleA} 
                  onChange={(e) => setSingleA(e.target.value)} 
                  placeholder="e.g. A JavaScript library for building user interfaces."
                  rows={5}
                />
              </div>
              <button className="btn btn-primary mt-3" onClick={handleAddSingle}>Add to Database</button>
            </div>
            
            <div className="card text-center">
              <h2>Export</h2>
              <p className="hint" style={{marginBottom: "1.5rem"}}>Download the merged database as a flat JSON file.</p>
              <button className="btn btn-success mt-3" onClick={downloadJson}>Download JSON</button>
            </div>
          </>
        )}

        {activeTab === 'bulk' && (
          <div className="card text-center" style={{padding: '4rem 2rem'}}>
            <h2>Single File Converter</h2>
            <p className="hint" style={{marginBottom: '2rem'}}>
              Upload a single text file containing multiple questions and answers. The answers must be enclosed in <code>```</code> blocks.
              It will automatically read, convert to JSON, and merge into your database.
            </p>
            <div className="upload-btn-wrapper mt-3">
              <button className="btn btn-primary" style={{padding: '1rem 2rem', fontSize: '1.2rem'}}>Select TXT File</button>
              <input type="file" accept=".txt" onChange={handleTxtUpload} />
            </div>
            {Object.keys(data).length > 0 && (
              <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
                <button className="btn btn-success" onClick={downloadJson}>Download JSON Database</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bulk-multi' && (
          <div className="card text-center" style={{padding: '4rem 2rem'}}>
            <h2>Batch Files Converter</h2>
            <p className="hint" style={{marginBottom: '2rem'}}>
              Upload <strong>multiple</strong> text files at once. All files will be parsed (answers enclosed in <code>```</code> blocks), merged together, and added to your database.
            </p>
            <div className="upload-btn-wrapper mt-3">
              <button className="btn btn-success" style={{padding: '1rem 2rem', fontSize: '1.2rem'}}>Select Multiple TXT Files</button>
              <input type="file" accept=".txt" multiple onChange={handleMultipleTxtUpload} />
            </div>
            {Object.keys(data).length > 0 && (
              <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
                <button className="btn btn-success" onClick={downloadJson}>Download JSON Database</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'json-to-txt' && (
          <>
            <div className="card text-center">
              <h2>Reverse Converter: JSON to TXT</h2>
              <p className="hint" style={{marginBottom: '1rem'}}>
                Upload any JSON file containing a flat dictionary to instantly convert it to your <code>```</code> delimited text format.
              </p>
              <div className="upload-btn-wrapper mt-3">
                <button className="btn btn-primary" style={{padding: '0.75rem 1.5rem', fontSize: '1rem'}}>Select JSON File</button>
                <input type="file" accept=".json" onChange={handleJsonToTxtUpload} />
              </div>
            </div>

            <div className="card">
              <h2>Add Q&A Pair (TXT)</h2>
              <p className="hint">Manually type a question and answer to append it directly to the TXT preview.</p>
              <div className="input-group">
                <label>Question</label>
                <textarea 
                  value={txtSingleQ} 
                  onChange={(e) => setTxtSingleQ(e.target.value)} 
                  placeholder="e.g. What is React?"
                  rows={2}
                />
              </div>
              <div className="input-group mt-3">
                <label>Answer</label>
                <textarea 
                  value={txtSingleA} 
                  onChange={(e) => setTxtSingleA(e.target.value)} 
                  placeholder="e.g. A JavaScript library for building user interfaces."
                  rows={4}
                />
              </div>
              <button className="btn btn-primary mt-3" onClick={handleAddTxtSingle}>Add to TXT Preview</button>
            </div>
            
            {jsonToTxtOutput && (
              <div className="card" style={{ marginTop: '2rem', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-color)' }}>TXT Preview</h3>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn" onClick={() => setJsonToTxtOutput("")} style={{ padding: '0.5rem 1.5rem', fontSize: '1rem', backgroundColor: '#ef4444', borderColor: '#ef4444', color: '#fff' }}>Clear Preview</button>
                    <button className="btn btn-success" onClick={downloadJsonToTxt} style={{ padding: '0.5rem 1.5rem', fontSize: '1rem' }}>Download TXT</button>
                  </div>
                </div>
                <div className="preview-list">
                  <pre style={{ 
                    margin: 0, 
                    background: 'rgba(0,0,0,0.85)', 
                    padding: '1.5rem', 
                    borderRadius: '0.5rem', 
                    fontFamily: '"Fira Code", "Courier New", Courier, monospace',
                    fontSize: '0.9rem',
                    color: '#e2e8f0',
                    overflowX: 'auto',
                    border: '1px solid rgba(0, 0, 0, 0.2)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {jsonToTxtOutput}
                  </pre>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'preview' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Database Preview</h2>
              {Object.keys(data).length > 0 && (
                <button className="btn btn-success" onClick={downloadJson} style={{ padding: '0.5rem 1.5rem', fontSize: '1rem' }}>Download JSON</button>
              )}
            </div>
            {Object.keys(data).length === 0 ? (
              <p className="hint text-center" style={{padding: '2rem'}}>Your database is currently empty. Add some Q&A pairs to preview them here!</p>
            ) : (
              <div className="preview-list">
                <pre style={{ 
                  margin: 0, 
                  background: 'rgba(0,0,0,0.85)', 
                  padding: '1.5rem', 
                  borderRadius: '0.5rem', 
                  fontFamily: '"Fira Code", "Courier New", Courier, monospace',
                  fontSize: '0.9rem',
                  color: '#e2e8f0',
                  overflowX: 'auto',
                  border: '1px solid rgba(0, 0, 0, 0.2)'
                }}>
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
