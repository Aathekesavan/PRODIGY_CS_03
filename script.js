/**
 * FortressPass - Password Checker & Generator JS Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const passwordInput = document.getElementById('passwordInput');
  const toggleVisibilityBtn = document.getElementById('toggleVisibilityBtn');
  const eyeOpenIcon = document.getElementById('eyeOpenIcon');
  const eyeClosedIcon = document.getElementById('eyeClosedIcon');
  const copyBtn = document.getElementById('copyBtn');
  
  const strengthBars = document.querySelectorAll('.strength-bar');
  const strengthText = document.getElementById('strengthText');
  const warningMessage = document.getElementById('warningMessage');
  
  const crackTimeVal = document.getElementById('crackTime');
  const entropyBitsVal = document.getElementById('entropyBits');
  const glowBg = document.getElementById('glowBg');
  
  // Checklist Elements
  const reqLength = document.getElementById('req-length');
  const reqUpper = document.getElementById('req-upper');
  const reqLower = document.getElementById('req-lower');
  const reqSymbol = document.getElementById('req-symbol');
  const reqNumber = document.getElementById('req-number');

  // Generator Elements
  const lengthSlider = document.getElementById('lengthSlider');
  const lengthVal = document.getElementById('lengthVal');
  const genUpper = document.getElementById('genUpper');
  const genLower = document.getElementById('genLower');
  const genNumbers = document.getElementById('genNumbers');
  const genSymbols = document.getElementById('genSymbols');
  const generateBtn = document.getElementById('generateBtn');
  const tipText = document.getElementById('tipText');

  // List of 100 most common passwords (lowercased for matching)
  const commonPasswords = [
    '123456', 'password', '123456789', '12345678', '12345', 'qwerty', 'password123',
    '111111', '1234567', 'letmein', '123123', 'admin', 'iloveyou', 'p@ssword', 
    'welcome', '1234567890', 'sunshine', 'football', 'monkey', 'charlie', 'princess',
    'shadow', 'solider', 'trustnoone', 'superman', 'jessica', 'michael', 'liverpool',
    'computer', 'secret', 'joshua', 'killer', 'daniel', 'system', 'password12',
    'test1234', 'qwertyuiop', 'asdfghjkl', 'admin123', 'master', 'dragon', 'hunter2',
    'matrix', 'access', 'monkey123', 'freedom', 'starwars', 'pokemon', 'beautiful',
    'baseball', 'justin', 'hunter', 'cookie', 'soccer', 'hockey', 'andrew', 'thomas',
    'christopher', 'jennifer', 'amanda', 'matthew', 'robert', 'david', 'joseph', 
    'william', 'elizabeth', 'sarah', 'chevy', 'ford', 'mustang', 'honda', 'toyota',
    'nissan', 'bmw', 'mercedes', 'ferrari', 'harley', 'yamaha', 'suzuki', 'kawasaki'
  ];

  // Cyber tips pool
  const tips = {
    empty: "Use a length of at least 12 characters, mixing letters, numbers, and symbols to maximize security against brute force attacks.",
    common: "⚠️ WARNING: This password is extremely common and easily guessable by attackers. Change it immediately.",
    veryWeak: "Tip: Add more characters. Short passwords are weak even if they contain symbols or numbers.",
    weak: "Tip: Try mixing uppercase letters and numbers to make the password harder to guess.",
    medium: "Tip: Adding special characters (e.g. $, @, #, %) will boost the complexity significantly.",
    strong: "Tip: Great password! Make it even stronger by converting it to a passphrase (multiple random words).",
    veryStrong: "🔒 Excellent! This password is highly secure. Make sure you use a unique password for each online account."
  };

  // SVG helper constants for checklist state
  const CROSS_SVG = `
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  `;
  const CHECK_SVG = `
    <polyline points="20 6 9 17 4 12"></polyline>
  `;

  // Toggle visibility of the password input
  toggleVisibilityBtn.addEventListener('click', () => {
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      eyeOpenIcon.classList.add('hidden');
      eyeClosedIcon.classList.remove('hidden');
    } else {
      passwordInput.type = 'password';
      eyeOpenIcon.classList.remove('hidden');
      eyeClosedIcon.classList.add('hidden');
    }
  });

  // Copy password to clipboard
  copyBtn.addEventListener('click', async () => {
    const password = passwordInput.value;
    if (!password) return;

    try {
      await navigator.clipboard.writeText(password);
      
      // Temporary success animation
      const originalHTML = copyBtn.innerHTML;
      copyBtn.innerHTML = `
        <svg class="action-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
      copyBtn.style.transform = 'scale(1.2)';
      
      setTimeout(() => {
        copyBtn.innerHTML = originalHTML;
        copyBtn.style.transform = 'scale(1)';
      }, 1500);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  });

  // Update requirement check items
  function updateChecklistItem(element, isValid) {
    const icon = element.querySelector('.check-icon');
    if (isValid) {
      element.classList.add('valid');
      icon.classList.remove('error');
      icon.classList.add('success');
      icon.innerHTML = CHECK_SVG;
    } else {
      element.classList.remove('valid');
      icon.classList.remove('success');
      icon.classList.add('error');
      icon.innerHTML = CROSS_SVG;
    }
  }

  // Calculate entropy and strength
  function checkPasswordStrength(password) {
    if (!password) {
      resetStrengthUI();
      return;
    }

    const len = password.length;
    
    // Check checklist requirements
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    const isLongEnough = len >= 8;

    updateChecklistItem(reqLength, isLongEnough);
    updateChecklistItem(reqUpper, hasUpper);
    updateChecklistItem(reqLower, hasLower);
    updateChecklistItem(reqNumber, hasNumber);
    updateChecklistItem(reqSymbol, hasSymbol);

    // Common password check
    const isCommon = commonPasswords.includes(password.toLowerCase());
    
    // Entropy Calculation: E = L * log2(R)
    let poolSize = 0;
    if (hasLower) poolSize += 26;
    if (hasUpper) poolSize += 26;
    if (hasNumber) poolSize += 10;
    if (hasSymbol) poolSize += 33; // Standard symbol set count
    if (poolSize === 0 && len > 0) poolSize = 10; // Fallback for other characters

    const entropy = len * Math.log2(poolSize);
    entropyBitsVal.textContent = `${Math.round(entropy)} bits`;

    // Time to crack calculations
    // Assume an attacker does 100 billion hash guesses per second (1e11)
    const guessesPerSec = 1e11;
    const totalGuesses = Math.pow(poolSize, len);
    const secondsToCrack = totalGuesses / guessesPerSec;
    
    crackTimeVal.textContent = formatCrackTime(secondsToCrack);

    // Determine strength level
    let strengthIndex = 0; // 0 = empty/very weak, 4 = very strong
    let strengthName = 'Very Weak';

    if (isCommon) {
      strengthIndex = 0;
      strengthName = 'Compromised';
      warningMessage.textContent = '⚠️ Common Password!';
      warningMessage.classList.remove('hidden');
      tipText.textContent = tips.common;
    } else {
      warningMessage.classList.add('hidden');
      
      // Classify based on entropy bits
      if (entropy < 28) {
        strengthIndex = 0;
        strengthName = 'Very Weak';
        tipText.textContent = tips.veryWeak;
      } else if (entropy >= 28 && entropy < 45) {
        strengthIndex = 1;
        strengthName = 'Weak';
        tipText.textContent = tips.weak;
      } else if (entropy >= 45 && entropy < 62) {
        strengthIndex = 2;
        strengthName = 'Medium';
        tipText.textContent = tips.medium;
      } else if (entropy >= 62 && entropy < 80) {
        strengthIndex = 3;
        strengthName = 'Strong';
        tipText.textContent = tips.strong;
      } else {
        strengthIndex = 4;
        strengthName = 'Very Strong';
        tipText.textContent = tips.veryStrong;
      }
    }

    // Update UI Styles based on strength index
    updateStrengthUI(strengthIndex, strengthName);
  }

  // Format seconds to readable format
  function formatCrackTime(seconds) {
    if (seconds < 1) return 'Instant';
    
    const timeUnits = [
      { unit: 'century', seconds: 3153600000 },
      { unit: 'year', seconds: 31536000 },
      { unit: 'day', seconds: 86400 },
      { unit: 'hour', seconds: 3600 },
      { unit: 'minute', seconds: 60 },
      { unit: 'second', seconds: 1 }
    ];

    for (let t of timeUnits) {
      const value = seconds / t.seconds;
      if (value >= 1) {
        const rounded = Math.round(value);
        let plural = rounded > 1 ? 's' : '';
        
        if (t.unit === 'century') {
          // Special cases for massive numbers
          if (value > 1e9) return `${(value / 1e9).toFixed(1)} Billion Centuries`;
          if (value > 1e6) return `${(value / 1e6).toFixed(1)} Million Centuries`;
        } else if (t.unit === 'year' && value > 1e6) {
          return `${Math.round(value / 1e6)} Million Years`;
        }
        
        return `${rounded} ${t.unit}${plural}`;
      }
    }
    return 'Instant';
  }

  // Reset UI elements back to starting state
  function resetStrengthUI() {
    strengthText.textContent = 'Empty';
    warningMessage.classList.add('hidden');
    entropyBitsVal.textContent = '0 bits';
    crackTimeVal.textContent = 'Instant';
    tipText.textContent = tips.empty;
    
    // Clear check items
    updateChecklistItem(reqLength, false);
    updateChecklistItem(reqUpper, false);
    updateChecklistItem(reqLower, false);
    updateChecklistItem(reqNumber, false);
    updateChecklistItem(reqSymbol, false);

    // Apply empty styles
    document.documentElement.style.setProperty('--strength-color', 'var(--color-empty)');
    document.documentElement.style.setProperty('--strength-glow', 'rgba(71, 85, 105, 0.15)');

    strengthBars.forEach(bar => {
      bar.classList.remove('active');
    });
  }

  // Update UI color themes based on password rating
  function updateStrengthUI(index, label) {
    strengthText.textContent = label;
    
    // Map index to colors
    let strengthColorName = '--color-very-weak';
    let strengthGlow = 'rgba(239, 68, 68, 0.2)';

    switch(index) {
      case 0:
        strengthColorName = label === 'Compromised' ? '--color-very-weak' : '--color-very-weak';
        strengthGlow = 'rgba(239, 68, 68, 0.22)';
        break;
      case 1:
        strengthColorName = '--color-weak';
        strengthGlow = 'rgba(249, 115, 22, 0.22)';
        break;
      case 2:
        strengthColorName = '--color-medium';
        strengthGlow = 'rgba(234, 179, 8, 0.22)';
        break;
      case 3:
        strengthColorName = '--color-strong';
        strengthGlow = 'rgba(34, 197, 94, 0.22)';
        break;
      case 4:
        strengthColorName = '--color-very-strong';
        strengthGlow = 'rgba(6, 182, 212, 0.25)';
        break;
    }

    // Set variable on root
    const rootStyle = document.documentElement.style;
    const colorHex = getComputedStyle(document.documentElement).getPropertyValue(strengthColorName).trim();
    
    rootStyle.setProperty('--strength-color', `var(${strengthColorName})`);
    rootStyle.setProperty('--strength-glow', strengthGlow);

    // Update active meter bars
    strengthBars.forEach((bar, idx) => {
      if (idx <= index) {
        bar.classList.add('active');
      } else {
        bar.classList.remove('active');
      }
    });
  }

  // Listen to input typing
  passwordInput.addEventListener('input', (e) => {
    checkPasswordStrength(e.target.value);
  });

  // Slider Length sync
  lengthSlider.addEventListener('input', (e) => {
    lengthVal.textContent = e.target.value;
  });

  // Generate cryptographic secure random password
  function generateSecurePassword() {
    const len = parseInt(lengthSlider.value);
    
    const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let availablePool = '';
    let guaranteedChars = [];

    // Ensure we have at least one character from each checked pool to avoid failing criteria
    if (genUpper.checked) {
      availablePool += upperChars;
      guaranteedChars.push(upperChars[getRandomInt(upperChars.length)]);
    }
    if (genLower.checked) {
      availablePool += lowerChars;
      guaranteedChars.push(lowerChars[getRandomInt(lowerChars.length)]);
    }
    if (genNumbers.checked) {
      availablePool += numberChars;
      guaranteedChars.push(numberChars[getRandomInt(numberChars.length)]);
    }
    if (genSymbols.checked) {
      availablePool += symbolChars;
      guaranteedChars.push(symbolChars[getRandomInt(symbolChars.length)]);
    }

    // Default pool fallback if nothing is checked
    if (availablePool === '') {
      availablePool = lowerChars + numberChars;
      genLower.checked = true;
      genNumbers.checked = true;
      guaranteedChars.push(lowerChars[getRandomInt(lowerChars.length)]);
      guaranteedChars.push(numberChars[getRandomInt(numberChars.length)]);
    }

    let generatedPassword = '';
    
    // Fill up the rest of the password length
    const remainingLength = len - guaranteedChars.length;
    for (let i = 0; i < remainingLength; i++) {
      const randIdx = getRandomInt(availablePool.length);
      generatedPassword += availablePool[randIdx];
    }

    // Combine and shuffle to prevent predictable prefix patterns
    const finalArray = [...guaranteedChars, ...generatedPassword.split('')];
    shuffleArray(finalArray);

    const finalPassword = finalArray.join('');
    
    // Insert into input and trigger assessment
    passwordInput.value = finalPassword;
    checkPasswordStrength(finalPassword);
  }

  // Cryptographically secure random number helper [0, max-1]
  function getRandomInt(max) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % max;
  }

  // Fisher-Yates Shuffle algorithm using secure random indexes
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = getRandomInt(i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Generate Button event
  generateBtn.addEventListener('click', () => {
    // Spin animation on icon
    const icon = generateBtn.querySelector('.btn-icon');
    icon.classList.add('spinning');
    
    setTimeout(() => {
      generateSecurePassword();
      icon.classList.remove('spinning');
    }, 400); // Small delay to visualize generation action
  });

  // Initial UI Reset
  resetStrengthUI();
});
