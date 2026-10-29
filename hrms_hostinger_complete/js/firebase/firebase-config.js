/**
 * DIALLO HRMS — ZERO-NETWORK CLIENT STORAGE & COMPATIBILITY LAYER
 * Completely decouples the application from Google Firebase servers.
 * All primary operations (Employees, Users, Attendance, Leaves, Documents, Announcements)
 * run authoritatively against Hostinger MySQL & PHP APIs.
 * Secondary entities (Expenses, Assets, Training, Settings) persist reliably in browser storage.
 */

var firebase;
var auth;
var db;
var FirebaseApp;

(function () {
  const noop = () => {};
  const asyncNoop = async () => {};

  // In-browser JSON store for legacy/secondary collections
  const store = {
    getCol(col) {
      try {
        const raw = localStorage.getItem('hrms_col_' + col);
        return raw ? JSON.parse(raw) : {};
      } catch (_) {
        return {};
      }
    },
    saveCol(col, data) {
      try {
        localStorage.setItem('hrms_col_' + col, JSON.stringify(data));
      } catch (_) {}
    },
    getDoc(col, id) {
      const c = this.getCol(col);
      return c[id] || null;
    },
    setDoc(col, id, data, merge = false) {
      const c = this.getCol(col);
      if (merge && c[id]) {
        c[id] = { ...c[id], ...data };
      } else {
        c[id] = { ...data };
      }
      this.saveCol(col, c);
      return c[id];
    },
    deleteDoc(col, id) {
      const c = this.getCol(col);
      if (c[id]) {
        delete c[id];
        this.saveCol(col, c);
      }
    }
  };

  function createQuery(colName, filters = [], sortField = null, sortDir = 'asc', limitCount = null) {
    return {
      where(field, op, val) {
        return createQuery(colName, [...filters, { field, op, val }], sortField, sortDir, limitCount);
      },
      orderBy(field, dir = 'asc') {
        return createQuery(colName, filters, field, dir, limitCount);
      },
      limit(n) {
        return createQuery(colName, filters, sortField, sortDir, n);
      },
      startAfter() {
        return this;
      },
      async get() {
        const colData = store.getCol(colName);
        let items = Object.keys(colData).map(k => ({ id: k, ...colData[k] }));

        // Apply filters
        for (const f of filters) {
          items = items.filter(it => {
            const v = it[f.field];
            if (f.op === '==') return v == f.val;
            if (f.op === '!=') return v != f.val;
            if (f.op === '>') return v > f.val;
            if (f.op === '>=') return v >= f.val;
            if (f.op === '<') return v < f.val;
            if (f.op === '<=') return v <= f.val;
            if (f.op === 'array-contains') return Array.isArray(v) && v.includes(f.val);
            if (f.op === 'in') return Array.isArray(f.val) && f.val.includes(v);
            return true;
          });
        }

        // Apply sort
        if (sortField) {
          items.sort((a, b) => {
            const valA = a[sortField] || '';
            const valB = b[sortField] || '';
            const cmp = String(valA).localeCompare(String(valB));
            return sortDir === 'desc' ? -cmp : cmp;
          });
        }

        // Apply limit
        if (limitCount && limitCount > 0) {
          items = items.slice(0, limitCount);
        }

        const docs = items.map(it => ({
          id: it.id,
          exists: true,
          data: () => ({ ...it }),
          ref: {
            id: it.id,
            delete: async () => store.deleteDoc(colName, it.id)
          }
        }));

        return {
          empty: docs.length === 0,
          size: docs.length,
          docs,
          forEach(cb) {
            docs.forEach(cb);
          },
          map(cb) {
            return docs.map(cb);
          }
        };
      },
      onSnapshot(cb) {
        if (typeof cb === 'function') {
          this.get().then(snap => {
            try { cb(snap); } catch (_) {}
          });
        }
        return noop;
      },
      doc(docId) {
        const id = docId || 'doc_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        return {
          id,
          async get() {
            const d = store.getDoc(colName, id);
            return {
              id,
              exists: !!d,
              data: () => d ? ({ ...d }) : null
            };
          },
          async set(data, opts = {}) {
            return store.setDoc(colName, id, data, !!opts.merge);
          },
          async update(data) {
            return store.setDoc(colName, id, data, true);
          },
          async delete() {
            return store.deleteDoc(colName, id);
          }
        };
      },
      async add(data) {
        const id = 'doc_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        store.setDoc(colName, id, data, false);
        return { id };
      }
    };
  }

  const firestoreStub = {
    collection(name) {
      return createQuery(name);
    },
    doc(path) {
      const parts = path.split('/');
      const col = parts[0];
      const id = parts[1] || '';
      return createQuery(col).doc(id);
    },
    batch() {
      const ops = [];
      return {
        set(docRef, data, opts) { ops.push(() => docRef.set(data, opts)); },
        update(docRef, data) { ops.push(() => docRef.update(data)); },
        delete(docRef) { ops.push(() => docRef.delete()); },
        async commit() {
          for (const op of ops) {
            try { await op(); } catch (_) {}
          }
        }
      };
    },
    async runTransaction(fn) {
      return fn({
        get: async (ref) => ref.get(),
        set: (ref, data, opts) => ref.set(data, opts),
        update: (ref, data) => ref.update(data),
        delete: (ref) => ref.delete()
      });
    }
  };

  const FieldValue = {
    serverTimestamp: () => new Date().toISOString(),
    delete: () => null,
    increment: (n) => n,
    arrayUnion: (...items) => items,
    arrayRemove: (...items) => items
  };

  const authStub = {
    currentUser: null,
    onAuthStateChanged: (cb) => {
      if (typeof cb === 'function') {
        const u = (typeof AuthGuard !== 'undefined' && AuthGuard.currentUser) ? AuthGuard.currentUser : null;
        try { cb(u); } catch (_) {}
      }
      return noop;
    },
    signInWithEmailAndPassword: async () => {
      throw new Error('Please use authService.signIn.');
    },
    createUserWithEmailAndPassword: async () => {
      throw new Error('User creation handled through users.php.');
    },
    signOut: asyncNoop
  };

  window.firebase = {
    apps: [{ name: '[DEFAULT]' }],
    app: () => window.firebase.apps[0],
    initializeApp: () => window.firebase.apps[0],
    auth: () => authStub,
    firestore: Object.assign(() => firestoreStub, { FieldValue }),
    storage: () => ({
      ref: () => ({
        put: asyncNoop,
        getDownloadURL: async () => ''
      })
    })
  };

  window.auth = authStub;
  window.db = firestoreStub;
  window.FirebaseApp = {
    auth: authStub,
    db: firestoreStub
  };

  firebase = window.firebase;
  auth = window.auth;
  db = window.db;
  FirebaseApp = window.FirebaseApp;
})();
